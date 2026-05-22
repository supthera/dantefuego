# Manual fulfillment playbook

When a customer buys a product with `fulfillment: manual` (defined in [`data/manual-products.json`](../data/manual-products.json)), Stripe collects payment and the site emails you to procure and ship the item yourself.

## What happens automatically

1. Customer completes Stripe Checkout on the product page.
2. Stripe sends `checkout.session.completed` to `/api/stripe/webhook`.
3. For manual items, the site emails `NOTIFY_EMAIL` via Resend with:
   - Product / variant / color / size
   - Amount paid
   - Customer email and shipping address
   - Stripe session ID
4. If Cloudflare D1 is configured, the order is stored in the `orders` table.

Printify items are logged the same way but do **not** trigger a manual procurement email (Printify auto-fulfillment can be added later).

## Your steps after notification

1. Open the email and confirm payment in the [Stripe Dashboard](https://dashboard.stripe.com/payments).
2. Procure the item (Oakley backpack, etc.).
3. Ship to the address in the email.
4. Reply to the customer with tracking (optional but recommended).

## Adding manual products

Edit [`data/manual-products.json`](../data/manual-products.json):

- Use IDs prefixed with `manual-` (e.g. `manual-oakley-backpack`).
- Set `"published": true` to show on the site.
- Match the same shape as Printify products: `title`, `description`, `images`, `options`, `variants[]` with `price` in **cents**.
- Set `"source": "manual"` and `"fulfillment": "manual"` are added automatically by [`lib/manual-products.js`](../lib/manual-products.js).

Commit, push, and redeploy.

## Required Cloudflare secrets

Set these under **Workers & Pages → dantefuegodev → Settings → Variables and Secrets**:

| Variable | Type | Purpose |
|----------|------|---------|
| `PRINTIFY_TOKEN` | Secret | Printify catalog |
| `STRIPE_SECRET_KEY` | Secret | Create Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Secret | Verify Stripe webhooks |
| `SITE_URL` | Plain | e.g. `https://dantefuegodev.pages.dev` |
| `RESEND_API_KEY` | Secret | Send manual order emails |
| `NOTIFY_EMAIL` | Plain | Your inbox for manual orders |
| `RESEND_FROM_EMAIL` | Plain | Sender address verified in Resend |

Optional:

| Variable | Purpose |
|----------|---------|
| `PRINTIFY_SHOP_ID` | If you have multiple Printify shops |
| `LIVE_PRODUCT_TAG` | Default `site-live` |
| `HIDDEN_PRODUCT_IDS` | Comma-separated Printify IDs to hide |

## Stripe webhook setup

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://dantefuegodev.pages.dev/api/stripe/webhook`
3. Event: `checkout.session.completed`
4. Copy the signing secret → `STRIPE_WEBHOOK_SECRET` in Cloudflare

## Optional: Cloudflare D1 order log

```bash
wrangler d1 create dantefuego-orders
```

Add to [`wrangler.toml`](../wrangler.toml):

```toml
[[d1_databases]]
binding = "DB"
database_name = "dantefuego-orders"
database_id = "<your-database-id>"
```

Apply schema:

```bash
wrangler d1 execute dantefuego-orders --file=./migrations/001_orders.sql
```

Without D1, orders are still emailed and logged to the function console.

## Local development

```bash
cp .env.example .env
# fill PRINTIFY_TOKEN, STRIPE_* , RESEND_* , NOTIFY_EMAIL
npm run dev
```

Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks locally:

```bash
stripe listen --forward-to localhost:8080/api/stripe/webhook
```
