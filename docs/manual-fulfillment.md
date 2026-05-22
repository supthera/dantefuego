# Fulfillment guide

Every product on the site is paid through **Stripe Checkout**. After payment, the Stripe webhook routes fulfillment by each product's `fulfillment` field.

| Source | Where it lives | After payment |
|--------|----------------|---------------|
| **Printify** | Printify catalog (`site-live` tag) | Order submitted to Printify automatically |
| **Manual** | [`data/manual-products.js`](../data/manual-products.js) | Email sent to you to procure and ship |

Printify products get `fulfillment: "printify"` automatically. Manual products get `fulfillment: "manual"` automatically.

---

# Manual fulfillment playbook

Use this when you add items in [`data/manual-products.js`](../data/manual-products.js) that are **not** in Printify — limited drops, third-party gear you buy yourself, etc.

## What happens automatically

1. Customer completes Stripe Checkout on the product page.
2. Stripe sends `checkout.session.completed` to `/api/stripe/webhook`.
3. For manual items, the site emails `NOTIFY_EMAIL` via Resend with:
   - Product / variant / color / size
   - Amount paid
   - Customer email and shipping address
   - Stripe session ID
4. If Cloudflare D1 is configured, the order is stored in the `orders` table.

Printify items skip the manual email and are submitted to Printify instead (see below).

## Your steps after a manual order email

1. Open the email and confirm payment in the [Stripe Dashboard](https://dashboard.stripe.com/payments).
2. Procure the item yourself.
3. Ship to the address in the email.
4. Reply to the customer with tracking (optional but recommended).

## Printify auto-fulfillment

Products from Printify (hoodies, backpacks, etc.) are submitted to the Printify Orders API when payment succeeds.

Requirements:

- `PRINTIFY_TOKEN` must include the **`orders.write`** scope (regenerate at [Printify API settings](https://printify.com/app/account/api) if needed).
- Customer shipping address comes from Stripe Checkout.
- Printify sends shipping notifications to the customer when the order ships (`send_shipping_notification: true`).
- The Stripe session ID is used as `external_id` to avoid duplicate Printify orders on webhook retries.

## Adding manual products

Edit [`data/manual-products.js`](../data/manual-products.js):

- Use IDs prefixed with `manual-` (e.g. `manual-limited-hat`).
- Set `"published": true` to show on the site.
- Match the same shape as Printify products: `title`, `description`, `images`, `options`, `variants[]` with `price` in **cents**.
- `source` and `fulfillment` are set to `"manual"` automatically by [`lib/manual-products.js`](../lib/manual-products.js).

Commit, push, and redeploy.

**Do not** duplicate Printify products here — if it's in Printify with the `site-live` tag, it already appears on the site and auto-fulfills.

## Required Cloudflare secrets

Set these under **Workers & Pages → dantefuegodev → Settings → Variables and Secrets**:

| Variable | Type | Purpose |
|----------|------|---------|
| `PRINTIFY_TOKEN` | Secret | Printify catalog + order submission |
| `PRINTIFY_SHOP_ID` | Secret | Shop ID (if not using default shop) |
| `STRIPE_SECRET_KEY` | Secret | Create Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Secret | Verify Stripe webhooks |
| `SITE_URL` | Plain | e.g. `https://dantefuegodev.pages.dev` |
| `RESEND_API_KEY` | Secret | Send manual order emails |
| `NOTIFY_EMAIL` | Plain | Your inbox for manual orders |
| `RESEND_FROM_EMAIL` | Plain | Sender address verified in Resend |

Optional:

| Variable | Purpose |
|----------|---------|
| `LIVE_PRODUCT_TAG` | Default `site-live` |
| `HIDDEN_PRODUCT_IDS` | Comma-separated Printify IDs to hide |

Resend vars are only required when you sell manual products.

## Stripe webhook setup

1. Stripe Dashboard → **Developers → Workbench → Webhooks** (or [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks))
2. Create destination → **Your account**
3. URL: `https://dantefuegodev.pages.dev/api/stripe/webhook`
4. Event: `checkout.session.completed`
5. Copy the signing secret → `STRIPE_WEBHOOK_SECRET` in Cloudflare

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

Without D1, Printify orders still submit and manual orders still email; idempotency for webhook retries is weaker without D1.

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
