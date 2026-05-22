import { getHealthStatus } from '../../lib/health.js';
import { jsonResponse } from '../../lib/printify.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const status = await getHealthStatus(context.env);

  return jsonResponse(status, status.ok ? 200 : 503);
}
