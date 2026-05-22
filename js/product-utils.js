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

const SIZE_TYPE_ALIASES = ['size', 'sizes'];
const COLOR_TYPE_ALIASES = ['color', 'colors', 'colour', 'colours'];

export function getOptionIndex(product, type) {
  const aliases =
    type === 'size' ? SIZE_TYPE_ALIASES : type === 'color' ? COLOR_TYPE_ALIASES : [String(type)];

  for (const alias of aliases) {
    const idx = (product.options || []).findIndex(
      (entry) => String(entry.type || '').toLowerCase() === alias
    );
    if (idx >= 0) return idx;
  }

  const namePattern =
    type === 'size' ? /\bsizes?\b/i : type === 'color' ? /\bcolou?rs?\b/i : null;
  if (namePattern) {
    const idx = (product.options || []).findIndex((entry) =>
      namePattern.test(String(entry.name || ''))
    );
    if (idx >= 0) return idx;
  }

  return -1;
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

  if (typeof selection === 'string') {
    const normalized = selection.trim().toLowerCase();
    const byTitle = values.findIndex(
      (value) => String(value.title || '').trim().toLowerCase() === normalized
    );
    if (byTitle >= 0) return byTitle;
  }

  return null;
}

function findColorValueIndex(colorValues, colorTitle) {
  if (!colorTitle) return -1;
  const normalized = normalizeOptionLabel(colorTitle);
  return colorValues.findIndex(
    (value) => normalizeOptionLabel(value.title) === normalized
  );
}

function normalizeOptionLabel(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function findSizeValueIndex(sizeValues, sizeTitle) {
  return findColorValueIndex(sizeValues, sizeTitle);
}

function variantMatchesSize(variant, product, size) {
  if (!size) return true;

  const sizeIdx = getOptionIndex(product, 'size');
  const normalizedSize = normalizeOptionLabel(size);

  if (sizeIdx >= 0) {
    const sizeValues = product.options[sizeIdx]?.values || [];
    const selectedIdx = findSizeValueIndex(sizeValues, size);
    const variantSizeIdx = resolveSelectionIndex(sizeValues, variant.options?.[sizeIdx]);

    if (selectedIdx >= 0 && variantSizeIdx === selectedIdx) {
      return true;
    }
  }

  return normalizeOptionLabel(getVariantSizeLabel(variant, product)) === normalizedSize;
}

function getVariantSizeLabel(variant, product) {
  const sizeIdx = getOptionIndex(product, 'size');
  if (sizeIdx >= 0) {
    const sizeValues = product.options[sizeIdx]?.values || [];
    const resolved = resolveSelectionIndex(sizeValues, variant.options?.[sizeIdx]);
    if (resolved !== null) {
      const title = sizeValues[resolved]?.title || '';
      if (title) return title;
    }
  }

  return getVariantSizeTitle(variant, product);
}

function getVariantSizeTitle(variant, product) {
  const sizeIdx = getOptionIndex(product, 'size');
  const colorTitles = new Set(getOptionValues(product, 'color').map((title) => title.toLowerCase()));
  const knownSizeTitles =
    sizeIdx >= 0
      ? new Set(
          (product.options[sizeIdx]?.values || []).map((value) =>
            String(value.title || '').trim().toLowerCase()
          )
        )
      : new Set();

  if (sizeIdx >= 0) {
    const sizeValues = product.options[sizeIdx]?.values || [];
    const resolved = resolveSelectionIndex(sizeValues, variant.options?.[sizeIdx]);
    if (resolved !== null) {
      const title = sizeValues[resolved]?.title || '';
      if (title && !colorTitles.has(title.toLowerCase())) return title;
    }
  }

  const parts = String(variant.title || '')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    const normalized = part.toLowerCase();
    if (colorTitles.has(normalized)) continue;
    if (knownSizeTitles.size && knownSizeTitles.has(normalized)) return part;
  }

  if (parts.length >= 2) {
    const candidate = parts[parts.length - 1];
    if (!colorTitles.has(candidate.toLowerCase())) return candidate;
  }

  return '';
}

function getSizesFromVariantTitles(product) {
  const sizes = new Set();

  for (const variant of product.variants || []) {
    const sizeTitle = getVariantSizeLabel(variant, product);
    if (sizeTitle) sizes.add(sizeTitle);
  }

  return sortSizeTitles([...sizes]);
}

function sortSizeTitles(sizes) {
  const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'ONE SIZE'];
  return sizes.sort((a, b) => {
    const aIdx = order.indexOf(a.toUpperCase());
    const bIdx = order.indexOf(b.toUpperCase());
    if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
    if (aIdx >= 0) return -1;
    if (bIdx >= 0) return 1;
    return a.localeCompare(b);
  });
}

export function getOptionValues(product, type) {
  const optionIdx = getOptionIndex(product, type);
  if (optionIdx < 0) {
    if (type === 'size') {
      return getSizesFromVariantTitles(product);
    }
    return [];
  }

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

    if (type === 'size') {
      return mergeSizeValues([], product);
    }

    return [];
  }

  const titles = values
    .filter((_, index) => availableIndexes.has(index))
    .map((value) => value.title);

  if (type === 'size') {
    return sortSizeTitles([...new Set(titles)]);
  }

  return titles;
}

export function getAvailableSizes(product, color = '') {
  const allSizes = getOptionValues(product, 'size');
  if (!color || allSizes.length <= 1) return allSizes;

  const colorIdx = getOptionIndex(product, 'color');
  if (colorIdx < 0) return allSizes;

  const colorValues = product.options[colorIdx]?.values || [];
  const colorVal = findColorValueIndex(colorValues, color);
  if (colorVal < 0) return allSizes;

  const sizes = new Set();
  for (const variant of product.variants || []) {
    const variantColor = resolveSelectionIndex(colorValues, variant.options?.[colorIdx]);
    if (variantColor !== colorVal) continue;

    const sizeTitle = getVariantSizeLabel(variant, product);
    if (sizeTitle) sizes.add(sizeTitle);
  }

  const filtered = sortSizeTitles([...sizes]).filter((title) => allSizes.includes(title));
  if (filtered.length) return filtered;
  return allSizes;
}

function mergeSizeValues(primary, product) {
  return sortSizeTitles([...new Set([...primary, ...getSizesFromVariantTitles(product)])]);
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

export function getFilteredVariants(product, { color = '', size = '' } = {}) {
  const colorIdx = getOptionIndex(product, 'color');
  const colorValues = colorIdx >= 0 ? product.options[colorIdx].values || [] : [];
  const colorVal =
    colorIdx >= 0 && color ? findColorValueIndex(colorValues, color) : -1;

  return (product.variants || []).filter((variant) => {
    const variantColor = resolveSelectionIndex(colorValues, variant.options?.[colorIdx]);
    const matchesColor =
      colorIdx < 0 || colorVal < 0 || !color || variantColor === colorVal;
    const matchesSize = variantMatchesSize(variant, product, size);
    return matchesColor && matchesSize;
  });
}

export function hasMultipleSizes(product) {
  return getOptionValues(product, 'size').length > 1;
}

export function findVariant(product, { color, size }) {
  const colors = getOptionValues(product, 'color');
  const needsSize = hasMultipleSizes(product);

  if (colors.length > 1 && !color) return null;
  if (needsSize && !size) return null;

  return getFilteredVariants(product, { color, size })[0] || null;
}

export function getImagesForColor(product, color) {
  const images = product.images || [];
  if (!color) return images;

  const colorIdx = getOptionIndex(product, 'color');
  if (colorIdx < 0) return images;

  const colorVal = findColorValueIndex(product.options[colorIdx].values || [], color);
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
