import { getContactEnv } from '../../../lib/env.js';
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

  const { accessKey, contactEmail } = getContactEnv(context.env);

  if (!accessKey) {
    return jsonResponse({ error: 'Missing WEB3FORMS_ACCESS_KEY' }, 503);
  }

  return jsonResponse(
    {
      accessKey,
      contactEmail
    },
    200,
    { cacheControl: 'public, max-age=300' }
  );
}
