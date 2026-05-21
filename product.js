import { initCursor, initFonts } from './js/site.js';
import {
  escapeHtml,
  findVariant,
  formatCents,
  formatPrice,
  getImagesForColor,
  getOptionValues,
  pickImage,
  stripHtml,
  uniqueImages
} from './js/product-utils.js';

initFonts();
initCursor();

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');
const pageRoot = document.getElementById('productPage');

let product = null;
let activeImages = [];

if (!productId) {
  showError('No product selected.');
} else {
  loadProduct(productId);
}

async function loadProduct(id) {
  showLoading();

  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`);
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

function showLoading() {
  pageRoot.innerHTML = '<div class="product-state loading">Loading product...</div>';
}

function showError(message) {
  pageRoot.innerHTML = `<div class="product-state product-state-error">${escapeHtml(message)}</div><a class="product-back" href="/#products">Back to Collection</a>`;
}

function renderProduct() {
  pageRoot.innerHTML = `
    <a class="product-back" href="/#products">Back to Collection</a>
    <div class="product-layout">
      <div class="product-gallery">
        <div class="product-gallery-main">
          <img id="galleryMain" alt="">
        </div>
        <div class="product-gallery-thumbs" id="galleryThumbs"></div>
      </div>
      <div class="product-details">
        <p class="collection-eyebrow">Inferno Collection</p>
        <h1 id="productTitle"></h1>
        <p id="productPrice" class="product-detail-price"></p>
        <div id="productDescription" class="product-description"></div>
        <div class="product-options" id="productOptions"></div>
        <div class="product-actions">
          <button class="pay-btn pay-stripe" id="stripeBtn" type="button">Pay with Card</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('productTitle').textContent = product.title;
  document.getElementById('productPrice').textContent = formatPrice(product.variants || []);

  const description = stripHtml(product.description);
  const descriptionEl = document.getElementById('productDescription');
  if (description) {
    descriptionEl.textContent = description;
  } else {
    descriptionEl.hidden = true;
  }

  renderOptions();
  updateGallery(getImagesForColor(product, document.getElementById('colorSelect')?.value || ''));
  updatePrice();
  document.getElementById('stripeBtn').addEventListener('click', handleCheckout);
}

function renderOptions() {
  const optionsEl = document.getElementById('productOptions');
  const colors = getOptionValues(product, 'color');
  const sizes = getOptionValues(product, 'size');
  const blocks = [];

  if (colors.length) {
    blocks.push(`
      <label class="product-option-label" for="colorSelect">Color</label>
      <select class="product-select" id="colorSelect">
        <option value="">Choose color</option>
        ${colors.map((color) => `<option>${escapeHtml(color)}</option>`).join('')}
      </select>
    `);
  }

  if (sizes.length) {
    blocks.push(`
      <label class="product-option-label" for="sizeSelect">Size</label>
      <select class="product-select" id="sizeSelect">
        <option value="">Choose size</option>
        ${sizes.map((size) => `<option>${escapeHtml(size)}</option>`).join('')}
      </select>
    `);
  } else {
    blocks.push(`
      <label class="product-option-label" for="sizeSelect">Size</label>
      <select class="product-select" id="sizeSelect">
        <option value="One Size" selected>One Size</option>
      </select>
    `);
  }

  optionsEl.innerHTML = blocks.join('');

  document.getElementById('colorSelect')?.addEventListener('change', (event) => {
    updateGallery(getImagesForColor(product, event.target.value));
    updatePrice();
  });

  document.getElementById('sizeSelect')?.addEventListener('change', updatePrice);
}

function updateGallery(images) {
  activeImages = uniqueImages(images.length ? images : product.images || []);
  const mainImg = document.getElementById('galleryMain');
  const thumbsEl = document.getElementById('galleryThumbs');
  if (!mainImg || !thumbsEl) return;

  if (!activeImages.length) {
    mainImg.removeAttribute('src');
    mainImg.alt = product.title;
    thumbsEl.innerHTML = '';
    return;
  }

  setActiveImage(0);

  thumbsEl.innerHTML = activeImages
    .map(
      (image, index) =>
        `<button type="button" class="product-gallery-thumb${index === 0 ? ' is-active' : ''}" data-index="${index}" aria-label="View image ${index + 1}">
          <img src="${escapeHtml(image.src)}" alt="">
        </button>`
    )
    .join('');

  thumbsEl.querySelectorAll('.product-gallery-thumb').forEach((button) => {
    button.addEventListener('click', () => {
      setActiveImage(Number(button.dataset.index));
    });
  });
}

function setActiveImage(index) {
  const image = activeImages[index] || pickImage(activeImages);
  const mainImg = document.getElementById('galleryMain');
  if (!mainImg || !image) return;

  mainImg.src = image.src;
  mainImg.alt = product.title;

  document.querySelectorAll('.product-gallery-thumb').forEach((button, buttonIndex) => {
    button.classList.toggle('is-active', buttonIndex === index);
  });
}

function updatePrice() {
  const color = document.getElementById('colorSelect')?.value || '';
  const size = document.getElementById('sizeSelect')?.value || '';
  const priceEl = document.getElementById('productPrice');
  const variant = findVariant(product, { color, size });

  if (variant?.price) {
    priceEl.textContent = formatCents(variant.price);
    return;
  }

  priceEl.textContent = formatPrice(product.variants || []);
}

function handleCheckout() {
  const color = document.getElementById('colorSelect')?.value || '';
  const size = document.getElementById('sizeSelect')?.value || '';
  const colors = getOptionValues(product, 'color');
  const sizes = getOptionValues(product, 'size');

  if (colors.length && !color) {
    alert('Please select a color');
    return;
  }

  if (sizes.length && !size) {
    alert('Please select a size');
    return;
  }

  const variant = findVariant(product, { color, size });
  if (!variant) {
    alert('That combination is not available');
    return;
  }

  alert('Stripe checkout — coming soon!');
}
