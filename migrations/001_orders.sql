CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  customer_email TEXT,
  shipping_json TEXT,
  line_items_json TEXT,
  created_at TEXT NOT NULL
);
