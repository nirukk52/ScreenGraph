-- Migration 010: Add mobile device session tracking tables
-- This migration adds tables for tracking mobile device sessions,
-- device information, and session history for the mobile automation service.

-- Create device_sessions table to track active device connections
CREATE TABLE IF NOT EXISTS device_sessions (
    session_id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('idle', 'connected', 'busy', 'disconnected', 'error')),
    current_app TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on device_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id ON device_sessions(device_id);

-- Create index on state for filtering active sessions
CREATE INDEX IF NOT EXISTS idx_device_sessions_state ON device_sessions(state);

-- Create index on last_activity_at for timeout detection
CREATE INDEX IF NOT EXISTS idx_device_sessions_last_activity ON device_sessions(last_activity_at);

-- Create device_info table to cache device information
CREATE TABLE IF NOT EXISTS device_info (
    device_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
    device_type TEXT NOT NULL CHECK (device_type IN ('real', 'emulator', 'simulator')),
    version TEXT NOT NULL,
    screen_width INTEGER,
    screen_height INTEGER,
    orientation TEXT CHECK (orientation IN ('portrait', 'landscape')),
    provider TEXT NOT NULL DEFAULT 'local' CHECK (provider IN ('local', 'aws-device-farm')),
    available BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on platform for filtering by platform
CREATE INDEX IF NOT EXISTS idx_device_info_platform ON device_info(platform);

-- Create index on available status
CREATE INDEX IF NOT EXISTS idx_device_info_available ON device_info(available);

-- Create index on provider
CREATE INDEX IF NOT EXISTS idx_device_info_provider ON device_info(provider);

-- Create mobile_operations_log table for audit trail
CREATE TABLE IF NOT EXISTS mobile_operations_log (
    id SERIAL PRIMARY KEY,
    session_id TEXT REFERENCES device_sessions(session_id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    operation_name TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_status TEXT NOT NULL CHECK (result_status IN ('success', 'error')),
    result_message TEXT,
    duration_ms INTEGER,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on session_id for session history queries
CREATE INDEX IF NOT EXISTS idx_mobile_operations_session ON mobile_operations_log(session_id);

-- Create index on device_id for device history queries
CREATE INDEX IF NOT EXISTS idx_mobile_operations_device ON mobile_operations_log(device_id);

-- Create index on operation_type for filtering by operation category
CREATE INDEX IF NOT EXISTS idx_mobile_operations_type ON mobile_operations_log(operation_type);

-- Create index on occurred_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_mobile_operations_occurred_at ON mobile_operations_log(occurred_at);

-- Comment on tables
COMMENT ON TABLE device_sessions IS 'Active mobile device sessions for automation';
COMMENT ON TABLE device_info IS 'Cached information about available mobile devices';
COMMENT ON TABLE mobile_operations_log IS 'Audit log of mobile automation operations';

-- Comment on columns
COMMENT ON COLUMN device_sessions.session_id IS 'Unique session identifier (ULID)';
COMMENT ON COLUMN device_sessions.device_id IS 'Device identifier (UDID for iOS, ADB serial for Android)';
COMMENT ON COLUMN device_sessions.state IS 'Current session state (idle, connected, busy, disconnected, error)';
COMMENT ON COLUMN device_sessions.current_app IS 'Currently running app package name';
COMMENT ON COLUMN device_sessions.metadata IS 'Session metadata (connection info, capabilities, etc.)';

COMMENT ON COLUMN device_info.device_id IS 'Device identifier (UDID for iOS, ADB serial for Android)';
COMMENT ON COLUMN device_info.provider IS 'Device provider (local or aws-device-farm)';
COMMENT ON COLUMN device_info.available IS 'Whether device is currently available for allocation';

COMMENT ON COLUMN mobile_operations_log.operation_type IS 'Operation category (device, app, screen, input)';
COMMENT ON COLUMN mobile_operations_log.operation_name IS 'Specific operation name (launch_app, tap, screenshot, etc.)';
COMMENT ON COLUMN mobile_operations_log.duration_ms IS 'Operation execution duration in milliseconds';
