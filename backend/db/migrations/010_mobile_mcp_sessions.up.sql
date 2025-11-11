-- Create table for tracking Mobile MCP sessions orchestrated by the backend.
-- PURPOSE: Persist session metadata so Encore workers can resume or audit Device Farm sessions.
CREATE TABLE IF NOT EXISTS mobile_mcp_sessions (
    mobile_mcp_session_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    device_platform TEXT NOT NULL,
    device_farm_job_arn TEXT,
    appium_endpoint_url TEXT,
    mcp_session_token TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    last_heartbeat_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_mcp_sessions_run
    ON mobile_mcp_sessions (run_id);

CREATE INDEX IF NOT EXISTS idx_mobile_mcp_sessions_status
    ON mobile_mcp_sessions (status);
