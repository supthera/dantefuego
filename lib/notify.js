import { getNotifyEnv } from './env.js';

export async function notifyManualOrder(env, { session, lineItems }) {
  const { resendApiKey, notifyEmail, fromEmail } = getNotifyEnv(env);

  if (!resendApiKey || !notifyEmail) {
    console.warn('Manual order notification skipped: missing RESEND_API_KEY or NOTIFY_EMAIL');
    return { sent: false };
  }

  const shipping = session.shipping_details || {};
  const address = shipping.address || session.customer_details?.address || {};
  const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : 'unknown';
  const subject =
    lineItems.length > 1
      ? `Manual order (${lineItems.length} items) — ${amount}`
      : `Manual order: ${lineItems[0]?.product_id || 'product'} — ${amount}`;

  const itemLines = lineItems.flatMap((item, index) => [
    `Item ${index + 1}:`,
    `  Product ID: ${item.product_id || 'n/a'}`,
    `  Variant ID: ${item.variant_id || 'n/a'}`,
    `  Color: ${item.color || 'n/a'}`,
    `  Size: ${item.size || 'n/a'}`,
    `  Quantity: ${item.quantity || 1}`,
    ''
  ]);

  const text = [
    'New manual-fulfillment order (payment received)',
    '',
    ...itemLines,
    `Total amount: ${amount}`,
    `Stripe session: ${session.id}`,
    '',
    `Customer email: ${session.customer_details?.email || session.customer_email || 'n/a'}`,
    `Customer name: ${session.customer_details?.name || 'n/a'}`,
    '',
    'Shipping address:',
    formatAddress(address),
    '',
    'Procure and ship manually, then reply to the customer with tracking.'
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [notifyEmail],
      subject,
      text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API ${response.status}: ${body.slice(0, 200)}`);
  }

  return { sent: true };
}

function formatAddress(address) {
  if (!address || !Object.keys(address).length) return 'Not provided';

  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country
  ]
    .filter(Boolean)
    .join('\n');
}
