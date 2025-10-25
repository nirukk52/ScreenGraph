import { api } from "encore.dev/api";
import db from "../db";

/**
 * Health check endpoint for monitoring service status
 * Why: Provides visibility into service health for observability tools
 */
interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  database: "connected" | "disconnected";
  timestamp: string;
}

export const health = api<void, HealthResponse>(
  { expose: true, method: "GET", path: "/health" },
  async () => {
    try {
      // Check database connectivity
      await db.queryRow`SELECT 1`;
      
      return {
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Health] Database check failed:", error);
      return {
        status: "unhealthy",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      };
    }
  }
);
