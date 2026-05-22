import { handleStripeWebhook } from '../../../lib/stripe-webhook.js';
import { jsonResponse } from '../../../lib/printify.js';

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const rawBody = await context.request.text();
    const signature = context.request.headers.get('stripe-signature') || '';
    const result = await handleStripeWebhook(context.env, rawBody, signature, context.env.DB);

    return jsonResponse(result, 200);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message || 'Webhook failed' }, 400);
  }
}
