import { initFonts, preloadCursors } from './js/site.js';
import { addToCart, initCartBadge } from './js/cart.js';
import { startCheckout } from './js/checkout-flow.js';
import { bindRomeScare, formatDescriptionHtml } from './js/rome-scare.js';
import {
  escapeHtml,
  findVariant,
  formatCents,
  formatPrice,
  formatProductTitleMarkup,
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
initCartBadge();

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
          <button class="pay-btn pay-cart" id="addToCartBtn" type="button" disabled>Add to Cart</button>
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
  pageRoot.innerHTML = `<div class="product-state product-state-error">${escapeHtml(message)}</div>`;
}

function renderProduct() {
  if (!document.getElementById('galleryMain')) {
    pageRoot.innerHTML = productShellMarkup();
  }

  document.getElementById('productTitle').innerHTML = formatProductTitleMarkup(product.title);
  document.getElementById('productPrice').textContent = formatPrice(product.variants || []);

  const description = stripHtml(product.description);
  const descriptionEl = document.getElementById('productDescription');
  if (description) {
    descriptionEl.innerHTML = formatDescriptionHtml(description);
    bindRomeScare(descriptionEl);
    descriptionEl.hidden = false;
  } else {
    descriptionEl.textContent = '';
    descriptionEl.hidden = true;
  }

  if (product.soldOut) {
    renderSoldOutState();
    return;
  }

  renderOptions();
  updateGallery(getImagesForColor(product, getVariantSelections().color));
  updatePrice();

  const stripeBtn = document.getElementById('stripeBtn');
  const addToCartBtn = document.getElementById('addToCartBtn');
  stripeBtn.disabled = false;
  addToCartBtn.disabled = false;

  if (!stripeBtn.dataset.bound) {
    stripeBtn.dataset.bound = '1';
    stripeBtn.addEventListener('click', handleCheckout);
  }

  if (!addToCartBtn.dataset.bound) {
    addToCartBtn.dataset.bound = '1';
    addToCartBtn.addEventListener('click', handleAddToCart);
  }
}

function renderSoldOutState() {
  document.getElementById('colorOptionField').innerHTML = '';
  document.getElementById('sizeOptionField').innerHTML = '';

  const priceEl = document.getElementById('productPrice');
  priceEl.textContent = 'Sold Out';
  priceEl.classList.add('product-detail-price-sold-out');

  updateGallery(uniqueImages(product.images || []));

  const actionsEl = document.querySelector('.product-actions');
  if (actionsEl) {
    actionsEl.innerHTML = '<p class="product-sold-out-notice">This piece is sold out and no longer available to order.</p>';
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

function renderSizeGuideMarkup(note) {
  if (!note) return '';

  return `
    <p class="product-size-guide">
      <svg class="product-size-guide-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <path d="M4 18.5c4.5-6.5 9-8.5 16-8.5"/>
        <path d="M7.5 16.2 8 14.8M10.5 14.8 11 13.4M13.5 13.4 14 12M16 12l.5-1.4"/>
        <circle cx="19.5" cy="9.5" r="1.1" fill="currentColor" stroke="none"/>
      </svg>
      <span>${escapeHtml(note)}</span>
    </p>
  `;
}

function renderSizeOption() {
  const field = document.getElementById('sizeOptionField');
  if (!field) return;

  const previousSize = document.getElementById('sizeSelect')?.value || '';
  const color = getVariantSelections().color;
  const allSizes = getOptionValues(product, 'size');
  const sizes = color ? getAvailableSizes(product, color) : allSizes;

  field.innerHTML =
    renderSizeGuideMarkup(product.sizeGuide) +
    renderOptionField('size', 'Size', sizes, {
      hideSingle: sizes.length <= 1 && getOptionValues(product, 'size').length <= 1,
      hideLabel: true
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

function renderOptionField(type, label, values, { hideSingle = false, hideLabel = false } = {}) {
  if (!values.length) return '';

  const id = `${type}Select`;

  if (hideSingle && values.length === 1) {
    return `<input type="hidden" id="${id}" value="${escapeHtml(values[0])}">`;
  }

  const labelMarkup = hideLabel
    ? ''
    : `<label class="product-option-label" for="${id}">${label}</label>`;
  const ariaLabel = hideLabel ? ` aria-label="${escapeHtml(label)}"` : '';

  return `
    ${labelMarkup}
    <select class="product-select" id="${id}"${ariaLabel}>
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
  const variant = getSelectedVariant();
  if (!variant) return;

  const stripeBtn = document.getElementById('stripeBtn');
  stripeBtn.disabled = true;

  try {
    await startCheckoutSession({
      productId: product.id,
      variantId: variant.id,
      color: variant.color,
      size: variant.size
    });
  } catch (error) {
    alert(error.message || 'Unable to start checkout');
    stripeBtn.disabled = false;
  }
}

function handleAddToCart() {
  const variant = getSelectedVariant();
  if (!variant) return;

  const image = activeImages[0] || pickImage(product.images || []);
  addToCart({
    productId: product.id,
    variantId: variant.id,
    color: variant.color,
    size: variant.size,
    title: product.title,
    price: variant.price,
    imageSrc: image?.src || ''
  });

  const addToCartBtn = document.getElementById('addToCartBtn');
  const originalLabel = addToCartBtn.textContent;
  addToCartBtn.textContent = 'Added';
  window.setTimeout(() => {
    addToCartBtn.textContent = originalLabel;
  }, 1200);
}

function getSelectedVariant() {
  const { color, size } = getVariantSelections();
  const colors = getOptionValues(product, 'color');
  const needsSize = needsSizeSelection(product, color);

  if (colors.length > 1 && !color) {
    alert('Please select a color');
    return null;
  }

  if (needsSize && !size) {
    alert('Please select a size');
    return null;
  }

  const variant = findVariant(product, { color, size });
  if (!variant) {
    alert('That combination is not available');
    return null;
  }

  return { ...variant, color, size };
}

async function startCheckoutSession(item) {
  startCheckout(item);
}
