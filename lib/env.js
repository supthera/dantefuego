export function getPrintifyEnv(env) {
  return {
    token: env.PRINTIFY_TOKEN || env.Printify_Token,
    shopId: env.PRINTIFY_SHOP_ID
  };
}
