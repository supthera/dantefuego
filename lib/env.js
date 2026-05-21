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
