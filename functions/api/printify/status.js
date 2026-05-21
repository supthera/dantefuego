import { getPrintifyEnv } from '../../../lib/env.js';
import { fetchAllPrintifyProductsRaw } from '../../../lib/printify-admin.js';
import { jsonResponse } from '../../../lib/printify.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET') {
    return jsonResponse({ error: 'GET only' }, 405);
  }

  const { token, shopId } = getPrintifyEnv(context.env);

  if (!token) {
    return jsonResponse({ error: 'Missing Printify token' }, 503);
  }

  try {
    const { shopId: resolvedShopId, products } = await fetchAllPrintifyProductsRaw({
      token,
      shopId
    });

    return jsonResponse({
      shop_id: resolvedShopId,
      products: products.map((product) => ({
        id: product.id,
        title: product.title,
        visible: product.visible,
        is_locked: product.is_locked,
        external: product.external,
        tags: product.tags
      }))
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message || 'Failed to inspect products' }, 500);
  }
}
