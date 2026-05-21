export const DEFAULT_LIVE_PRODUCT_TAG = 'site-live';

export function getPrintifyEnv(env) {
  return {
    token: env.PRINTIFY_TOKEN || env.Printify_Token,
    shopId: env.PRINTIFY_SHOP_ID,
    liveTag: env.LIVE_PRODUCT_TAG || DEFAULT_LIVE_PRODUCT_TAG
  };
}
