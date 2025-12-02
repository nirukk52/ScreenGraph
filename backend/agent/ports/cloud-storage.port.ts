/**
 * CloudStoragePort defines the interface for uploading application artifacts to cloud providers.
 * PURPOSE: Abstracts cloud-specific upload logic (BrowserStack, Sauce Labs, AWS Device Farm, etc.)
 * to enable testing on remote device clouds.
 */

export interface CloudStoragePort {
  /**
   * Uploads an application file to the cloud provider's storage.
   * @param localFilePath - Absolute path to the APK/IPA file on local filesystem
   * @returns Cloud URL identifier (e.g., "bs://hashed_app_id" for BrowserStack)
   */
  uploadApp(localFilePath: string): Promise<CloudAppUploadResult>;

  /**
   * Checks if a previously uploaded app is still available in cloud storage.
   * @param cloudUrl - The cloud URL returned from a previous upload
   * @returns Boolean indicating if the app is accessible
   */
  isAppAvailable(cloudUrl: string): Promise<boolean>;
}

/** Result of uploading an app to cloud storage */
export interface CloudAppUploadResult {
  /** Cloud provider's URL identifier for the uploaded app */
  cloudUrl: string;
  /** Original file name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Optional: Expiration time if the cloud provider has time-limited storage */
  expiresAt?: Date;
}

