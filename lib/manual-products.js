import manualCatalogData from '../data/manual-products.json' with { type: 'json' };

export function isManualProductId(productId) {
  return String(productId).startsWith('manual-');
}

export function loadManualProducts() {
  return (manualCatalogData.products || [])
    .filter((product) => product.published !== false)
    .map(normalizeManualProduct);
}

export function getManualProduct(productId) {
  const product = (manualCatalogData.products || []).find(
    (entry) => String(entry.id) === String(productId)
  );

  if (!product || product.published === false) {
    throw new Error('Product not found');
  }

  return normalizeManualProduct(product);
}

function normalizeManualProduct(product) {
  const variants = (product.variants || []).filter((variant) => variant.is_enabled !== false);

  if (!variants.length) {
    throw new Error('Product not available');
  }

  return {
    id: product.id,
    title: product.title,
    description: product.description || '',
    images: product.images || [],
    options: product.options || [],
    variants: variants.map((variant) => ({
      id: variant.id,
      price: variant.price,
      title: variant.title,
      is_enabled: true,
      is_default: variant.is_default,
      options: variant.options
    })),
    source: 'manual',
    fulfillment: 'manual'
  };
}
