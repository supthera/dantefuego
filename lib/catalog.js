import { getPrintifyEnv } from './env.js';
import { getManualProduct, isManualProductId, loadManualProducts } from './manual-products.js';
import { fetchPrintifyProduct, fetchPrintifyProducts } from './printify.js';

export async function fetchCatalogProducts(env) {
  const printifyEnv = getPrintifyEnv(env);
  const manualProducts = loadManualProducts();

  let printifyProducts = [];
  if (printifyEnv.token) {
    try {
      printifyProducts = await fetchPrintifyProducts(printifyEnv);
    } catch (error) {
      if (!manualProducts.length) throw error;
      console.error('Printify catalog unavailable:', error.message);
    }
  }

  return [...printifyProducts, ...manualProducts];
}

export async function fetchCatalogProduct(env, productId) {
  if (isManualProductId(productId)) {
    return getManualProduct(productId);
  }

  const printifyEnv = getPrintifyEnv(env);
  return fetchPrintifyProduct({ ...printifyEnv, productId });
}
