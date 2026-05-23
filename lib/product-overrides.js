import overrides from '../data/product-overrides.js';

export function applyProductOverrides(product) {
  const id = String(product.id);
  const title = overrides.titles?.[id];
  const description = overrides.descriptions?.[id];

  if (!title && !description) return product;

  return {
    ...product,
    ...(title ? { title } : {}),
    ...(description ? { description } : {})
  };
}
