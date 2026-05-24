export const DEFAULT_LIVE_PRODUCT_TAG = 'site-live';
export const DEFAULT_HIDDEN_PRODUCT_IDS = [
  '6a0f70f4baa33f89580de183',
  '6a0f65c2ce3250e5710266bc'
];

export function getPrintifyEnv(env) {
  return {
    token: env.PRINTIFY_TOKEN || env.Printify_Token,
    shopId: env.PRINTIFY_SHOP_ID,
    liveTag: env.LIVE_PRODUCT_TAG || DEFAULT_LIVE_PRODUCT_TAG,
    hiddenProductIds: getHiddenProductIds(env)
  };
}

export function getHiddenProductIds(env) {
  if (env.HIDDEN_PRODUCT_IDS === '') return [];

  if (env.HIDDEN_PRODUCT_IDS) {
    return env.HIDDEN_PRODUCT_IDS.split(',').map((id) => id.trim()).filter(Boolean);
  }

  return DEFAULT_HIDDEN_PRODUCT_IDS;
}

export function getStripeEnv(env) {
  return {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET
  };
}

export function getNotifyEnv(env) {
  return {
    resendApiKey: env.RESEND_API_KEY,
    notifyEmail: env.NOTIFY_EMAIL,
    fromEmail: env.RESEND_FROM_EMAIL || 'orders@dantefuego.com'
  };
}

export function getContactEnv(env) {
  return {
    accessKey: env.WEB3FORMS_ACCESS_KEY,
    contactEmail: env.CONTACT_EMAIL || env.NOTIFY_EMAIL || 'hello@dantefuego.com'
  };
}

export function getSiteUrl(env, request) {
  if (env.SITE_URL) return env.SITE_URL.replace(/\/$/, '');

  if (request?.url) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  return 'http://localhost:8080';
}
