import overrides from '../data/product-overrides.js';

export function applyProductOverrides(product) {
  const description = overrides.descriptions?.[String(product.id)];
  if (!description) return product;

  return { ...product, description };
}
