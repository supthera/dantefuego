import { getStripeEnv } from '../../../lib/env.js';
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

  const { publishableKey } = getStripeEnv(context.env);

  if (!publishableKey) {
    return jsonResponse({ error: 'Missing STRIPE_PUBLISHABLE_KEY' }, 503);
  }

  return jsonResponse({ publishableKey }, 200, { cacheControl: 'public, max-age=300' });
}
