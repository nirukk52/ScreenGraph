-- Migration 009: Play Store App Metadata Storage
-- PURPOSE: Create normalized tables for persisting Play Store metadata and
-- associated media assets (screenshots, trailers) keyed by package name.

CREATE TYPE appinfo_ingest_status_enum AS ENUM (
  'pending',
  'succeeded',
  'failed'
);

CREATE TYPE appinfo_media_kind_enum AS ENUM (
  'phone_screenshot',
  'tablet_screenshot',
  'feature_graphic',
  'video_trailer'
);

CREATE TABLE appinfo (
  app_package TEXT PRIMARY KEY,
  app_display_name TEXT NOT NULL,
  short_description TEXT NULL,
  long_description TEXT NULL,
  developer_name TEXT NOT NULL,
  developer_id TEXT NULL,
  developer_email TEXT NULL,
  developer_website TEXT NULL,
  developer_address TEXT NULL,
  content_rating TEXT NULL,
  primary_category_code TEXT NOT NULL,
  category_codes TEXT[] NOT NULL DEFAULT '{}',
  installs_label TEXT NULL,
  min_installs BIGINT NULL,
  max_installs BIGINT NULL,
  rating_score NUMERIC(3, 2) NULL,
  ratings_count BIGINT NULL,
  reviews_count BIGINT NULL,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price_micros BIGINT NULL,
  currency_code TEXT NULL,
  offers_in_app_purchases BOOLEAN NULL,
  supports_ads BOOLEAN NULL,
  play_store_url TEXT NOT NULL,
  icon_url TEXT NULL,
  header_image_url TEXT NULL,
  video_trailer_url TEXT NULL,
  privacy_policy_url TEXT NULL,
  latest_version TEXT NULL,
  android_version TEXT NULL,
  android_version_text TEXT NULL,
  last_play_store_update TIMESTAMPTZ NULL,
  ingest_status appinfo_ingest_status_enum NOT NULL DEFAULT 'pending',
  ingest_error_code TEXT NULL,
  ingest_error_detail TEXT NULL,
  ingested_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE appinfo IS 'Cached Play Store application metadata keyed by package name.';
COMMENT ON COLUMN appinfo.app_package IS 'Android package identifier (e.g., com.example.app).';
COMMENT ON COLUMN appinfo.primary_category_code IS 'Primary Google Play category code for this app.';
COMMENT ON COLUMN appinfo.category_codes IS 'All category codes advertised by the Play Store entry.';
COMMENT ON COLUMN appinfo.rating_score IS 'Average user rating reported by Play Store (0-5).';
COMMENT ON COLUMN appinfo.installs_label IS 'Human-readable installs band (e.g., 1,000+).';
COMMENT ON COLUMN appinfo.ingest_status IS 'Latest ingest attempt status (pending, succeeded, failed).';

CREATE INDEX appinfo_by_category ON appinfo(primary_category_code);
CREATE INDEX appinfo_by_updated_at ON appinfo(updated_at DESC);

CREATE TABLE appinfo_media (
  app_package TEXT NOT NULL,
  media_kind appinfo_media_kind_enum NOT NULL,
  position INT NOT NULL,
  asset_url TEXT NOT NULL,
  thumbnail_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (app_package, media_kind, position),
  CONSTRAINT fk_appinfo_media_app_package
    FOREIGN KEY (app_package) REFERENCES appinfo(app_package) ON DELETE CASCADE
);

COMMENT ON TABLE appinfo_media IS 'Ordered media assets associated with an app (screenshots, trailers).';
COMMENT ON COLUMN appinfo_media.media_kind IS 'Play Store media classification (screenshot, feature graphic, trailer).';
COMMENT ON COLUMN appinfo_media.position IS 'Zero-based ordering of media items within the same kind.';

CREATE INDEX appinfo_media_by_kind ON appinfo_media(media_kind);

