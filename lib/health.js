import { fetchPrintifyProducts } from './printify.js';

export async function getHealthStatus({ token, shopId, liveTag }) {
  const status = {
    ok: false,
    printify_token: Boolean(token),
    printify_shop_id: Boolean(shopId),
    live_product_tag: liveTag || null,
    product_count: null,
    error: null
  };

  if (!token) {
    status.error = 'Missing PRINTIFY_TOKEN';
    return status;
  }

  try {
    const products = await fetchPrintifyProducts({ token, shopId, liveTag });
    status.ok = true;
    status.product_count = products.length;
  } catch (error) {
    status.error = error.message || 'Failed to reach Printify';
  }

  return status;
}
