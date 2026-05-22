-- Phase 2: manual product catalog in D1 (not wired yet — see docs/phase2-manual-admin.md)
CREATE TABLE IF NOT EXISTS manual_products (
  id TEXT PRIMARY KEY,
  published INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  images_json TEXT NOT NULL DEFAULT '[]',
  options_json TEXT NOT NULL DEFAULT '[]',
  variants_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
