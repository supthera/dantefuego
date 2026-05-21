import { getPrintifyEnv } from '../../lib/env.js';
import { fetchPrintifyProducts, jsonResponse } from '../../lib/printify.js';

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
    const { token, shopId, liveTag } = getPrintifyEnv(context.env);
    const data = await fetchPrintifyProducts({ token, shopId, liveTag });

    return jsonResponse({ data });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message || 'Failed to load products' }, 500);
  }
}
