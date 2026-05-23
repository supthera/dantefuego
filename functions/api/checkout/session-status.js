import { getCheckoutSessionStatus } from '../../../lib/stripe.js';
import { jsonResponse } from '../../../lib/printify.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (context.request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const sessionId = new URL(context.request.url).searchParams.get('session_id');
    const data = await getCheckoutSessionStatus(context.env, sessionId);

    return jsonResponse(data, 200, { cacheControl: 'private, no-store' });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message || 'Failed to retrieve session' }, 400);
  }
}
