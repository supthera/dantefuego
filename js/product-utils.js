export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatProductTitleMarkup(title) {
  return escapeHtml(String(title || '').trim());
}

export function formatPrice(variants) {
  const prices = variants.map((variant) => variant.price).filter(Boolean);
  if (!prices.length) return '';

  const min = Math.min(...prices);
  return `$${(min / 100).toFixed(2)}`;
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

  const byId = values.findIndex(
    (value) => value.id === selection || String(value.id) === String(selection)
  );
  if (byId >= 0) return byId;

  const numeric = Number(selection);
  if (Number.isFinite(numeric)) {
    const byNumericId = values.findIndex((value) => Number(value.id) === numeric);
    if (byNumericId >= 0) return byNumericId;

    if (Number.isInteger(numeric) && values[numeric]) {
      return numeric;
    }
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

function getVariantColorLabel(variant, product) {
  const colorIdx = getOptionIndex(product, 'color');
  if (colorIdx >= 0) {
    const colorValues = product.options[colorIdx]?.values || [];
    const resolved = resolveSelectionIndex(colorValues, variant.options?.[colorIdx]);
    if (resolved !== null) {
      return colorValues[resolved]?.title || '';
    }
  }

  const parts = String(variant.title || '')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  return parts[0] || '';
}

function variantMatchesColor(variant, product, color) {
  if (!color) return true;

  const colorIdx = getOptionIndex(product, 'color');
  if (colorIdx < 0) return true;

  const colorValues = product.options[colorIdx]?.values || [];
  const colorVal = findColorValueIndex(colorValues, color);
  if (colorVal < 0) return true;

  const variantColor = resolveSelectionIndex(colorValues, variant.options?.[colorIdx]);
  if (variantColor === colorVal) return true;

  return normalizeOptionLabel(getVariantColorLabel(variant, product)) === normalizeOptionLabel(color);
}

export function getVariantSizeLabel(variant, product) {
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
  const colorIdx = getOptionIndex(product, 'color');
  const colorTitles = new Set(
    (colorIdx >= 0 ? product.options[colorIdx]?.values || [] : []).map((value) =>
      String(value.title || '').trim().toLowerCase()
    )
  );
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

function parseMenSize(title) {
  const match = String(title).match(/Men'?s?\s+([\d.]+)/i);
  return match ? parseFloat(match[1]) : null;
}

function sortSizeTitles(sizes) {
  const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'ONE SIZE'];
  return sizes.sort((a, b) => {
    const aIdx = order.indexOf(a.toUpperCase());
    const bIdx = order.indexOf(b.toUpperCase());
    if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
    if (aIdx >= 0) return -1;
    if (bIdx >= 0) return 1;

    const aMen = parseMenSize(a);
    const bMen = parseMenSize(b);
    if (aMen !== null && bMen !== null) return aMen - bMen;
    if (aMen !== null) return -1;
    if (bMen !== null) return 1;

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

  if (!availableIndexes.size && hasOptionMetadata && type === 'size') {
    for (const variant of product.variants || []) {
      const selection = variant.options?.[optionIdx];
      if (typeof selection !== 'string') continue;
      const resolved = findColorValueIndex(values, selection);
      if (resolved >= 0) availableIndexes.add(resolved);
    }
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
    return mergeSizeValues(titles, product);
  }

  return titles;
}

export function getSizesForSelection(product, color = '') {
  return color ? getAvailableSizes(product, color) : getOptionValues(product, 'size');
}

export function needsSizeSelection(product, color = '') {
  return getSizesForSelection(product, color).length > 1;
}

export function getAvailableSizes(product, color = '') {
  const allSizes = getOptionValues(product, 'size');
  if (!color) return allSizes;

  const sizeIdx = getOptionIndex(product, 'size');
  const sizeValues = sizeIdx >= 0 ? product.options[sizeIdx]?.values || [] : [];
  const sizes = new Set();

  for (const variant of product.variants || []) {
    if (!variantMatchesColor(variant, product, color)) continue;

    if (sizeIdx >= 0) {
      const resolved = resolveSelectionIndex(sizeValues, variant.options?.[sizeIdx]);
      if (resolved !== null && sizeValues[resolved]?.title) {
        sizes.add(sizeValues[resolved].title);
        continue;
      }
    }

    const sizeTitle = getVariantSizeLabel(variant, product);
    if (sizeTitle) sizes.add(sizeTitle);
  }

  const filtered = sortSizeTitles([...sizes]);
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
  const raw = String(html || '');
  if (!raw) return '';

  // Plain-text descriptions (overrides) keep intentional line breaks.
  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    return raw.trim();
  }

  const div = document.createElement('div');
  div.innerHTML = raw.replace(/<\s*br\s*\/?>/gi, '\n');
  return (div.textContent || '').trim();
}

export function getFilteredVariants(product, { color = '', size = '' } = {}) {
  return (product.variants || []).filter((variant) => {
    const matchesColor = variantMatchesColor(variant, product, color);
    const matchesSize = variantMatchesSize(variant, product, size);
    return matchesColor && matchesSize;
  });
}

export function hasMultipleSizes(product) {
  return getOptionValues(product, 'size').length > 1;
}

export function findVariant(product, { color, size }) {
  const colors = getOptionValues(product, 'color');
  const needsSize = needsSizeSelection(product, color);

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
      .filter((variant) => variantMatchesColor(variant, product, color))
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
