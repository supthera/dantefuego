import { createCheckoutSession } from '../../../lib/stripe.js';
import { jsonResponse } from '../../../lib/printify.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (context.request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const payload = await context.request.json();
    const session = await createCheckoutSession(context.env, payload, context.request);

    return jsonResponse(session, 200, { cacheControl: 'private, no-store' });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message || 'Failed to create checkout session' }, 400);
  }
}
