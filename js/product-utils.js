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

export function getOptionValues(product, type) {
  const optionIdx = getOptionIndex(product, type);
  if (optionIdx < 0) return [];

  const availableIndexes = new Set(
    (product.variants || [])
      .map((variant) => variant.options?.[optionIdx])
      .filter((value) => value !== undefined && value !== null)
  );

  const option = product.options[optionIdx];
  return (option?.values || [])
    .filter((_, index) => availableIndexes.has(index))
    .map((value) => value.title);
}

export function getOptionIndex(product, type) {
  return (product.options || []).findIndex((entry) => entry.type === type);
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
  const colorVal =
    colorIdx >= 0 && color
      ? product.options[colorIdx].values.findIndex((value) => value.title === color)
      : -1;
  const sizeVal =
    sizeIdx >= 0 && size
      ? product.options[sizeIdx].values.findIndex((value) => value.title === size)
      : -1;

  return (product.variants || []).find((variant) => {
    const matchesColor = colorIdx < 0 || colorVal < 0 || variant.options[colorIdx] === colorVal;
    const matchesSize = sizeIdx < 0 || sizeVal < 0 || variant.options[sizeIdx] === sizeVal;
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
      .filter((variant) => variant.options[colorIdx] === colorVal)
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
