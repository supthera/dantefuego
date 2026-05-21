import { getHealthStatus } from '../../lib/health.js';
import { jsonResponse } from '../../lib/printify.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const status = await getHealthStatus({
    token: context.env.PRINTIFY_TOKEN,
    shopId: context.env.PRINTIFY_SHOP_ID
  });

  return jsonResponse(status, status.ok ? 200 : 503);
}
