export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatPrice(variants) {
  const prices = variants.map((variant) => variant.price).filter(Boolean);
  if (!prices.length) return '';

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const minLabel = `$${(min / 100).toFixed(2)}`;

  return min === max ? minLabel : `${minLabel}+`;
}

export function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getOptionIndex(product, type) {
  const needle = String(type).toLowerCase();
  return (product.options || []).findIndex(
    (entry) => String(entry.type || '').toLowerCase() === needle
  );
}

function resolveSelectionIndex(values, selection) {
  if (selection === undefined || selection === null) return null;

  if (Number.isInteger(selection) && values[selection]) {
    return selection;
  }

  const byId = values.findIndex((value) => value.id === selection);
  if (byId >= 0) return byId;

  const numeric = Number(selection);
  if (Number.isInteger(numeric) && values[numeric]) {
    return numeric;
  }

  return null;
}

export function getOptionValues(product, type) {
  const optionIdx = getOptionIndex(product, type);
  if (optionIdx < 0) return [];

  const values = product.options[optionIdx]?.values || [];
  const availableIndexes = new Set();
  let hasOptionMetadata = false;

  for (const variant of product.variants || []) {
    const selection = variant.options?.[optionIdx];
    if (selection === undefined || selection === null) continue;

    hasOptionMetadata = true;
    const resolved = resolveSelectionIndex(values, selection);
    if (resolved !== null) availableIndexes.add(resolved);
  }

  if (!availableIndexes.size) {
    if (!hasOptionMetadata && values.length) {
      return values.map((value) => value.title);
    }
    return [];
  }

  return values
    .filter((_, index) => availableIndexes.has(index))
    .map((value) => value.title);
}

export function pickImage(images) {
  return (
    (images || []).find((image) => image.is_default) ||
    (images || []).find((image) => image.position === 'front') ||
    (images || [])[0] ||
    null
  );
}

export function productUrl(id, previewSrc) {
  const params = new URLSearchParams({ id: String(id) });
  if (previewSrc) params.set('img', previewSrc);
  return `/product.html?${params.toString()}`;
}

const imagePreloadCache = new Map();

export function preloadImage(src) {
  if (!src) return Promise.resolve();
  if (imagePreloadCache.has(src)) return imagePreloadCache.get(src);

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  }).catch(() => {});

  imagePreloadCache.set(src, promise);
  return promise;
}

export function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return (div.textContent || '').trim();
}

export function findVariant(product, { color, size }) {
  const colorIdx = getOptionIndex(product, 'color');
  const sizeIdx = getOptionIndex(product, 'size');
  const colorValues = colorIdx >= 0 ? product.options[colorIdx].values || [] : [];
  const sizeValues = sizeIdx >= 0 ? product.options[sizeIdx].values || [] : [];
  const colorVal =
    colorIdx >= 0 && color
      ? colorValues.findIndex((value) => value.title === color)
      : -1;
  const sizeVal =
    sizeIdx >= 0 && size
      ? sizeValues.findIndex((value) => value.title === size)
      : -1;

  return (product.variants || []).find((variant) => {
    const variantColor = resolveSelectionIndex(colorValues, variant.options?.[colorIdx]);
    const variantSize = resolveSelectionIndex(sizeValues, variant.options?.[sizeIdx]);
    const matchesColor = colorIdx < 0 || colorVal < 0 || variantColor === colorVal;
    const matchesSize = sizeIdx < 0 || sizeVal < 0 || variantSize === sizeVal;
    return matchesColor && matchesSize;
  });
}

export function getImagesForColor(product, color) {
  const images = product.images || [];
  if (!color) return images;

  const colorIdx = getOptionIndex(product, 'color');
  if (colorIdx < 0) return images;

  const colorVal = product.options[colorIdx].values.findIndex((value) => value.title === color);
  if (colorVal < 0) return images;

  const variantIds = new Set(
    (product.variants || [])
      .filter((variant) => {
        const variantColor = resolveSelectionIndex(
          product.options[colorIdx].values || [],
          variant.options?.[colorIdx]
        );
        return variantColor === colorVal;
      })
      .map((variant) => variant.id)
  );

  const filtered = images.filter(
    (image) =>
      !image.variant_ids?.length || image.variant_ids.some((id) => variantIds.has(id))
  );

  return filtered.length ? filtered : images;
}

export function uniqueImages(images) {
  const seen = new Set();
  return (images || []).filter((image) => {
    if (!image?.src || seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
}
