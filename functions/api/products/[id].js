import { fetchCatalogProduct } from '../../../lib/catalog.js';
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
    const data = await fetchCatalogProduct(context.env, context.params.id);

    return jsonResponse({ data }, 200, { cacheControl: 'private, no-store' });
  } catch (error) {
    console.error(error);
    const status = error.message === 'Product not found' ? 404 : 500;
    return jsonResponse({ error: error.message || 'Failed to load product' }, status);
  }
}
