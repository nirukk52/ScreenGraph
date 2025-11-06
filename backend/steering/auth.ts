import { Header } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { APIError } from "encore.dev/api";

/**
 * PURPOSE: Centralized write-token validation for mutating endpoints.
 */

const WriteToken = secret("STEERING_WRITE_TOKEN");

export interface AuthHeaders {
  Authorization?: Header<string>;
  "X-Steering-Write-Token"?: Header<string>;
}

export function requireWriteToken(headers: AuthHeaders): void {
  const configured = WriteToken();
  const bearer = headers.Authorization?.startsWith("Bearer ")
    ? headers.Authorization.slice("Bearer ".length)
    : undefined;
  const headerToken = headers["X-Steering-Write-Token"];
  const provided = bearer || headerToken;
  if (!configured) {
    // If not configured, deny to avoid accidental open writes
    throw APIError.permissionDenied("write_token_not_configured");
  }
  if (!provided || provided !== configured) {
    throw APIError.permissionDenied("invalid_write_token");
  }
}


