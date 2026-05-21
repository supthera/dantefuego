import { getPrintifyEnv } from '../../../lib/env.js';
import { unlockStuckPrintifyProducts } from '../../../lib/printify-admin.js';
import { jsonResponse } from '../../../lib/printify.js';

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return jsonResponse({ error: 'POST only' }, 405);
  }

  const { token, shopId } = getPrintifyEnv(context.env);

  if (!token) {
    return jsonResponse({ error: 'Missing Printify token' }, 503);
  }

  try {
    const body = await context.request.json().catch(() => ({}));
    const productIds = Array.isArray(body.product_ids)
      ? body.product_ids.map(String)
      : [];

    const report = await unlockStuckPrintifyProducts({
      token,
      shopId,
      productIds
    });

    return jsonResponse(report);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message || 'Failed to unlock products' }, 500);
  }
}
