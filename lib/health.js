import { getPrintifyEnv } from './env.js';
import { fetchCatalogProducts } from './catalog.js';

export async function getHealthStatus(env) {
  const { token, shopId, liveTag } = getPrintifyEnv(env);

  const status = {
    ok: false,
    printify_token: Boolean(token),
    printify_shop_id: Boolean(shopId),
    live_product_tag: liveTag || null,
    product_count: null,
    manual_product_count: null,
    error: null
  };

  try {
    const products = await fetchCatalogProducts(env);
    status.ok = true;
    status.product_count = products.length;
    status.manual_product_count = products.filter((product) => product.source === 'manual').length;

    if (!token && status.manual_product_count === 0) {
      status.ok = false;
      status.error = 'Missing PRINTIFY_TOKEN';
    }
  } catch (error) {
    status.error = error.message || 'Failed to load catalog';
  }

  return status;
}
