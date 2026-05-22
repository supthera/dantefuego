import { getNotifyEnv, getStripeEnv } from './env.js';
import { notifyManualOrder } from './notify.js';
import { getOrderBySessionId, saveOrder } from './orders.js';

export async function handleStripeWebhook(env, rawBody, signatureHeader, db) {
  const { webhookSecret } = getStripeEnv(env);
  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET');
  }

  await verifyStripeSignature(rawBody, signatureHeader, webhookSecret);
  const event = JSON.parse(rawBody);

  if (event.type !== 'checkout.session.completed') {
    return { received: true, handled: false };
  }

  const session = event.data.object;
  const existing = await getOrderBySessionId(db, session.id);
  if (existing) {
    return { received: true, handled: true, duplicate: true };
  }

  const lineItems = [
    {
      product_id: session.metadata?.product_id,
      variant_id: session.metadata?.variant_id,
      source: session.metadata?.source,
      fulfillment: session.metadata?.fulfillment,
      color: session.metadata?.color,
      size: session.metadata?.size,
      amount_total: session.amount_total
    }
  ];

  const order = {
    id: crypto.randomUUID(),
    stripe_session_id: session.id,
    status: 'paid',
    customer_email: session.customer_details?.email || session.customer_email || '',
    shipping_json: JSON.stringify(session.shipping_details || session.customer_details?.address || {}),
    line_items_json: JSON.stringify(lineItems),
    created_at: new Date().toISOString()
  };

  await saveOrder(db, order);

  if (session.metadata?.fulfillment === 'manual') {
    await notifyManualOrder(env, { session, lineItems });
  }

  return { received: true, handled: true };
}

async function verifyStripeSignature(payload, signatureHeader, secret) {
  if (!signatureHeader) {
    throw new Error('Missing Stripe signature');
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const index = part.indexOf('=');
      return [part.slice(0, index), part.slice(index + 1)];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) {
    throw new Error('Invalid Stripe signature header');
  }

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expected = bufferToHex(mac);

  if (!timingSafeEqual(expected, signature)) {
    throw new Error('Invalid Stripe webhook signature');
  }
}

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
