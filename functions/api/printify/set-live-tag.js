import { DEFAULT_LIVE_PRODUCT_TAG, getPrintifyEnv } from '../../../lib/env.js';
import { setLiveTagsOnProducts } from '../../../lib/printify-admin.js';
import { jsonResponse } from '../../../lib/printify.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET' && context.request.method !== 'POST') {
    return jsonResponse({ error: 'GET or POST only' }, 405);
  }

  const { token, shopId, liveTag } = getPrintifyEnv(context.env);

  if (!token) {
    return jsonResponse({ error: 'Missing Printify token' }, 503);
  }

  try {
    let productIds = [];

    if (context.request.method === 'POST') {
      const body = await context.request.json().catch(() => ({}));
      productIds = Array.isArray(body.product_ids)
        ? body.product_ids.map(String)
        : [];
    } else {
      const url = new URL(context.request.url);
      const singleId = url.searchParams.get('product_id');
      const manyIds = url.searchParams.get('product_ids');
      if (singleId) productIds = [singleId];
      else if (manyIds) productIds = manyIds.split(',').map((id) => id.trim()).filter(Boolean);
    }

    if (!productIds.length) {
      return jsonResponse({ error: 'Provide product_id or product_ids' }, 400);
    }

    const report = await setLiveTagsOnProducts({
      token,
      shopId,
      productIds,
      tag: liveTag || DEFAULT_LIVE_PRODUCT_TAG
    });

    return jsonResponse(report);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message || 'Failed to set live tags' }, 500);
  }
}
