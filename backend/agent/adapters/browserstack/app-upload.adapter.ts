import log from "encore.dev/log";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type {
  CloudAppUploadResult,
  CloudStoragePort,
} from "../../ports/cloud-storage.port";

/**
 * BrowserStackAppUploadAdapter implements CloudStoragePort for BrowserStack App Automate.
 * PURPOSE: Handles uploading APK/IPA files to BrowserStack's cloud storage via their REST API.
 * Credentials are extracted from the BrowserStack hub URL.
 */
export class BrowserStackAppUploadAdapter implements CloudStoragePort {
  private readonly username: string;
  private readonly accessKey: string;
  private readonly uploadApiUrl = "https://api-cloud.browserstack.com/app-automate/upload";

  constructor(username: string, accessKey: string) {
    if (!username || !accessKey) {
      throw new Error("BrowserStack username and access key are required");
    }
    this.username = username;
    this.accessKey = accessKey;
  }

  /**
   * Uploads an APK/IPA file to BrowserStack App Automate storage.
   * @param localFilePath - Absolute path to the application file
   * @returns Cloud URL in format "bs://hashed_app_id"
   */
  async uploadApp(localFilePath: string): Promise<CloudAppUploadResult> {
    const logger = log.with({
      module: "agent",
      actor: "browserstack-upload",
      file: path.basename(localFilePath),
    });

    logger.info("Starting BrowserStack app upload", { localFilePath });

    try {
      // Read file stats
      const fileStats = await stat(localFilePath);
      const fileName = path.basename(localFilePath);

      logger.info("Reading app file", {
        fileName,
        fileSizeBytes: fileStats.size,
      });

      // Read file buffer
      const fileBuffer = await readFile(localFilePath);

      // Create form data for multipart upload
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: "application/octet-stream" });
      formData.append("file", blob, fileName);

      // Upload to BrowserStack
      logger.info("Uploading to BrowserStack", { uploadApiUrl: this.uploadApiUrl });

      const authString = Buffer.from(`${this.username}:${this.accessKey}`).toString(
        "base64",
      );

      const response = await fetch(this.uploadApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("BrowserStack upload failed", {
          statusCode: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `BrowserStack upload failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const result = (await response.json()) as BrowserStackUploadResponse;

      logger.info("BrowserStack upload successful", {
        cloudUrl: result.app_url,
        customId: result.custom_id,
      });

      return {
        cloudUrl: result.app_url,
        fileName,
        fileSize: fileStats.size,
        uploadedAt: new Date(),
        // BrowserStack apps expire after 30 days of inactivity
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      logger.error("App upload failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Checks if a previously uploaded app is still available.
   * Note: BrowserStack doesn't provide a direct API to check app availability.
   * This is a placeholder for future implementation.
   */
  async isAppAvailable(cloudUrl: string): Promise<boolean> {
    const logger = log.with({
      module: "agent",
      actor: "browserstack-upload",
      cloudUrl,
    });

    logger.info("Checking app availability (placeholder)", { cloudUrl });

    // BrowserStack will return error during session creation if app is not available
    // For now, we assume the app is available if URL is in correct format
    return cloudUrl.startsWith("bs://");
  }
}

/** BrowserStack API response for app upload */
interface BrowserStackUploadResponse {
  /** BrowserStack app URL identifier */
  app_url: string;
  /** Custom ID if provided */
  custom_id?: string;
  /** Shareable ID for the app */
  shareable_id?: string;
}

