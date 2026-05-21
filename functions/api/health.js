import { getPrintifyEnv } from '../../lib/env.js';
import { getHealthStatus } from '../../lib/health.js';
import { jsonResponse } from '../../lib/printify.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const { token, shopId } = getPrintifyEnv(context.env);
  const status = await getHealthStatus({ token, shopId });

  return jsonResponse(status, status.ok ? 200 : 503);
}
