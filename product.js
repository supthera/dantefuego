import { initFonts, preloadCursors } from './js/site.js';
import {
  escapeHtml,
  findVariant,
  formatCents,
  formatPrice,
  getImagesForColor,
  getAvailableSizes,
  getFilteredVariants,
  getOptionValues,
  needsSizeSelection,
  pickImage,
  preloadImage,
  stripHtml,
  uniqueImages
} from './js/product-utils.js';

initFonts();
preloadCursors();

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');
const previewImageSrc = params.get('img');
const pageRoot = document.getElementById('productPage');

let product = null;
let activeImages = [];

if (!productId) {
  showError('No product selected.');
} else {
  renderProductShell(previewImageSrc);
  loadProduct(productId);
}

function productShellMarkup() {
  return `
    <a class="product-back" href="/#products">Back to Collection</a>
    <div class="product-layout">
      <div class="product-gallery">
        <div class="product-gallery-main">
          <img id="galleryMain" alt="" width="900" height="1200" decoding="async" fetchpriority="high">
        </div>
        <div class="product-gallery-thumbs" id="galleryThumbs"></div>
      </div>
      <div class="product-details">
        <p class="collection-eyebrow">Inferno Collection</p>
        <h1 id="productTitle"></h1>
        <p id="productPrice" class="product-detail-price"></p>
        <div id="productDescription" class="product-description"></div>
        <div class="product-options">
          <div class="product-option-field" id="colorOptionField"></div>
          <div class="product-option-field" id="sizeOptionField"></div>
        </div>
        <div class="product-actions">
          <button class="pay-btn pay-stripe" id="stripeBtn" type="button" disabled>Pay with Card</button>
        </div>
      </div>
    </div>
  `;
}

function renderProductShell(initialImageSrc) {
  pageRoot.innerHTML = productShellMarkup();

  if (initialImageSrc) {
    setGalleryImage(document.getElementById('galleryMain'), initialImageSrc, '');
  }
}

async function loadProduct(id) {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`, { cache: 'no-store' });
    const payload = await res.json();

    if (!res.ok) {
      throw new Error(payload.error || 'Failed to load product');
    }

    product = payload.data;
    document.title = `${product.title} — Dante Fuego`;
    renderProduct();
  } catch (error) {
    showError(error.message || 'Unable to load product');
  }
}

function showError(message) {
  pageRoot.innerHTML = `<div class="product-state product-state-error">${escapeHtml(message)}</div><a class="product-back" href="/#products">Back to Collection</a>`;
}

function renderProduct() {
  if (!document.getElementById('galleryMain')) {
    pageRoot.innerHTML = productShellMarkup();
  }

  document.getElementById('productTitle').textContent = product.title;
  document.getElementById('productPrice').textContent = formatPrice(product.variants || []);

  const description = stripHtml(product.description);
  const descriptionEl = document.getElementById('productDescription');
  if (description) {
    descriptionEl.textContent = description;
    descriptionEl.hidden = false;
  } else {
    descriptionEl.textContent = '';
    descriptionEl.hidden = true;
  }

  renderOptions();
  updateGallery(getImagesForColor(product, getVariantSelections().color));
  updatePrice();

  const stripeBtn = document.getElementById('stripeBtn');
  stripeBtn.disabled = false;
  if (!stripeBtn.dataset.bound) {
    stripeBtn.dataset.bound = '1';
    stripeBtn.addEventListener('click', handleCheckout);
  }
}

function renderOptions() {
  renderColorOption();
  renderSizeOption();

  document.getElementById('colorSelect')?.addEventListener('change', (event) => {
    updateGallery(getImagesForColor(product, event.target.value));
    renderSizeOption();
    updatePrice();
  });
}

function renderColorOption() {
  const field = document.getElementById('colorOptionField');
  if (!field) return;

  field.innerHTML = renderOptionField(
    'color',
    'Color',
    getOptionValues(product, 'color'),
    { hideSingle: true }
  );
}

function renderSizeOption() {
  const field = document.getElementById('sizeOptionField');
  if (!field) return;

  const previousSize = document.getElementById('sizeSelect')?.value || '';
  const color = getVariantSelections().color;
  const allSizes = getOptionValues(product, 'size');
  const sizes = color ? getAvailableSizes(product, color) : allSizes;

  field.innerHTML = renderOptionField('size', 'Size', sizes, {
    hideSingle: sizes.length <= 1 && getOptionValues(product, 'size').length <= 1
  });

  const sizeSelect = document.getElementById('sizeSelect');
  if (!sizeSelect) return;

  if (previousSize && sizes.includes(previousSize)) {
    sizeSelect.value = previousSize;
  } else if (sizeSelect.tagName === 'SELECT') {
    sizeSelect.value = '';
  }

  sizeSelect.addEventListener('change', updatePrice);
}

function renderOptionField(type, label, values, { hideSingle = false } = {}) {
  if (!values.length) return '';

  const id = `${type}Select`;

  if (hideSingle && values.length === 1) {
    return `<input type="hidden" id="${id}" value="${escapeHtml(values[0])}">`;
  }

  return `
    <label class="product-option-label" for="${id}">${label}</label>
    <select class="product-select" id="${id}">
      <option value="">Choose ${label.toLowerCase()}</option>
      ${values.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}
    </select>
  `;
}

function getVariantSelections() {
  return {
    color: document.getElementById('colorSelect')?.value || '',
    size: document.getElementById('sizeSelect')?.value || ''
  };
}

function updateGallery(images) {
  activeImages = uniqueImages(images.length ? images : product.images || []);
  const mainImg = document.getElementById('galleryMain');
  const thumbsEl = document.getElementById('galleryThumbs');
  if (!mainImg || !thumbsEl) return;

  if (!activeImages.length) {
    mainImg.removeAttribute('src');
    mainImg.classList.remove('is-ready');
    mainImg.alt = product.title;
    thumbsEl.innerHTML = '';
    return;
  }

  const previewIndex = previewImageSrc
    ? activeImages.findIndex((image) => image.src === previewImageSrc)
    : -1;
  const initialIndex = previewIndex >= 0 ? previewIndex : 0;

  thumbsEl.innerHTML = activeImages
    .map(
      (image, index) =>
        `<button type="button" class="product-gallery-thumb${index === initialIndex ? ' is-active' : ''}" data-index="${index}" aria-label="View image ${index + 1}">
          <img src="${escapeHtml(image.src)}" alt="" width="72" height="96" loading="lazy" decoding="async">
        </button>`
    )
    .join('');

  thumbsEl.querySelectorAll('.product-gallery-thumb').forEach((button) => {
    button.addEventListener('click', () => {
      setActiveImage(Number(button.dataset.index));
    });
  });

  setActiveImage(initialIndex, { keepVisible: previewIndex >= 0 && initialIndex === previewIndex });
}

async function setActiveImage(index, { keepVisible = false } = {}) {
  const image = activeImages[index] || pickImage(activeImages);
  const mainImg = document.getElementById('galleryMain');
  if (!mainImg || !image) return;

  await setGalleryImage(mainImg, image.src, product.title, { keepVisible });

  document.querySelectorAll('.product-gallery-thumb').forEach((button, buttonIndex) => {
    button.classList.toggle('is-active', buttonIndex === index);
  });
}

async function setGalleryImage(mainImg, src, alt, { keepVisible = false } = {}) {
  if (!keepVisible) {
    mainImg.classList.remove('is-ready');
  }

  await preloadImage(src);
  mainImg.src = src;
  mainImg.alt = alt;

  if (mainImg.decode) {
    try {
      await mainImg.decode();
    } catch {
      // Browser could not decode; still reveal the image.
    }
  }

  mainImg.classList.add('is-ready');
}

function updatePrice() {
  const { color, size } = getVariantSelections();
  const priceEl = document.getElementById('productPrice');
  const colors = getOptionValues(product, 'color');
  const needsColor = colors.length > 1;
  const needsSize = needsSizeSelection(product, color);
  const colorReady = !needsColor || color;
  const sizeReady = !needsSize || size;

  if (!colorReady) {
    priceEl.textContent = formatPrice(product.variants || []);
    return;
  }

  if (!sizeReady) {
    priceEl.textContent = formatPrice(getFilteredVariants(product, { color }));
    return;
  }

  const variant = findVariant(product, { color, size });
  if (variant?.price) {
    priceEl.textContent = formatCents(variant.price);
    return;
  }

  priceEl.textContent = formatPrice(product.variants || []);
}

async function handleCheckout() {
  const { color, size } = getVariantSelections();
  const colors = getOptionValues(product, 'color');
  const needsSize = needsSizeSelection(product, color);

  if (colors.length > 1 && !color) {
    alert('Please select a color');
    return;
  }

  if (needsSize && !size) {
    alert('Please select a size');
    return;
  }

  const variant = findVariant(product, { color, size });
  if (!variant) {
    alert('That combination is not available');
    return;
  }

  const stripeBtn = document.getElementById('stripeBtn');
  stripeBtn.disabled = true;

  try {
    const res = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        variantId: variant.id,
        color,
        size
      })
    });
    const payload = await res.json();

    if (!res.ok) {
      throw new Error(payload.error || 'Checkout failed');
    }

    window.location.href = payload.url;
  } catch (error) {
    alert(error.message || 'Unable to start checkout');
    stripeBtn.disabled = false;
  }
}
