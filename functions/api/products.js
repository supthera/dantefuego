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
    const data = await fetchPrintifyProducts({
      token: context.env.PRINTIFY_TOKEN,
      shopId: context.env.PRINTIFY_SHOP_ID
    });

    return jsonResponse({ data });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message || 'Failed to load products' }, 500);
  }
}
