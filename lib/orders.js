const CREATE_ORDERS_TABLE = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  customer_email TEXT,
  shipping_json TEXT,
  line_items_json TEXT,
  created_at TEXT NOT NULL
);
`;

export async function ensureOrdersTable(db) {
  if (!db) return;
  await db.prepare(CREATE_ORDERS_TABLE).run();
}

export async function getOrderBySessionId(db, stripeSessionId) {
  if (!db) return null;

  await ensureOrdersTable(db);
  const row = await db
    .prepare('SELECT id FROM orders WHERE stripe_session_id = ?')
    .bind(stripeSessionId)
    .first();

  return row || null;
}

export async function saveOrder(db, order) {
  if (!db) {
    console.log('Order log (no D1 binding):', order.stripe_session_id);
    return { saved: false };
  }

  await ensureOrdersTable(db);
  await db
    .prepare(
      `INSERT INTO orders (id, stripe_session_id, status, customer_email, shipping_json, line_items_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      order.id,
      order.stripe_session_id,
      order.status,
      order.customer_email,
      order.shipping_json,
      order.line_items_json,
      order.created_at
    )
    .run();

  return { saved: true };
}
