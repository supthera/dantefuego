import { getNotifyEnv, getPrintifyEnv } from './env.js';
import { fetchCatalogProducts } from './catalog.js';
import { countManualDrafts } from './manual-products.js';

export async function getHealthStatus(env) {
  const { token, shopId, liveTag } = getPrintifyEnv(env);
  const { resendApiKey, notifyEmail } = getNotifyEnv(env);
  const draftManualCount = countManualDrafts();

  const status = {
    ok: false,
    printify_token: Boolean(token),
    printify_shop_id: Boolean(shopId),
    live_product_tag: liveTag || null,
    product_count: null,
    manual_product_count: null,
    manual_draft_count: draftManualCount,
    resend_api_key: Boolean(resendApiKey),
    notify_email: Boolean(notifyEmail),
    manual_notifications_ready: Boolean(resendApiKey && notifyEmail),
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
