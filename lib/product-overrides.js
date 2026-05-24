import overrides from '../data/product-overrides.js';
import { getVariantSizeLabel } from '../js/product-utils.js';

const LARGE_SIZE_PATTERN = /^(2x(l)?|3x(l)?)$/i;

function isLargeSize(sizeLabel) {
  const normalized = String(sizeLabel || '').trim().replace(/\s+/g, '');
  return LARGE_SIZE_PATTERN.test(normalized);
}

function applyVariantPrices(product, pricing) {
  return (product.variants || []).map((variant) => {
    const sizeLabel = getVariantSizeLabel(variant, product);
    const price = isLargeSize(sizeLabel) ? pricing.large : pricing.default;

    if (price === undefined) return variant;

    return { ...variant, price };
  });
}

export function applyProductOverrides(product) {
  const id = String(product.id);
  const title = overrides.titles?.[id];
  const description = overrides.descriptions?.[id];
  const pricing = overrides.variantPrices?.[id];

  if (!title && !description && !pricing) return product;

  return {
    ...product,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(pricing ? { variants: applyVariantPrices(product, pricing) } : {})
  };
}
