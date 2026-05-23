import { initFonts, preloadCursors } from './js/site.js';
import {
  clearCart,
  getCart,
  initCartBadge,
  removeFromCart,
  updateCartQuantity
} from './js/cart.js';
import { startCheckout } from './js/checkout-flow.js';
import {
  escapeHtml,
  findVariant,
  formatCents,
  formatProductTitleMarkup,
  pickImage,
  productUrl
} from './js/product-utils.js';

initFonts();
preloadCursors();
initCartBadge();

const pageRoot = document.getElementById('cartContent');
const params = new URLSearchParams(window.location.search);

if (params.get('checkout') === 'success') {
  clearCart();
}

renderCart();

async function renderCart() {
  const cart = getCart();

  if (!cart.length) {
    pageRoot.innerHTML = `
      <div class="cart-empty">
        <p>Your cart is empty.</p>
        <a class="cart-empty-link" href="/#products">Browse the collection</a>
      </div>
    `;
    return;
  }

  pageRoot.innerHTML = '<div class="cart-loading">Loading cart...</div>';

  try {
    const rows = await Promise.all(cart.map((item) => resolveCartItem(item)));
    const validRows = rows.filter(Boolean);

    if (!validRows.length) {
      clearCart();
      renderCart();
      return;
    }

    const subtotal = validRows.reduce((sum, row) => sum + row.price * row.quantity, 0);

    pageRoot.innerHTML = `
      ${params.get('checkout') === 'success' ? '<p class="cart-notice cart-notice-success">Payment received. Thank you.</p>' : ''}
      ${params.get('checkout') === 'cancel' ? '<p class="cart-notice">Checkout was canceled.</p>' : ''}
      <ul class="cart-list">
        ${validRows.map((row) => renderCartRow(row)).join('')}
      </ul>
      <div class="cart-summary">
        <div class="cart-summary-row">
          <span>Subtotal</span>
          <span>${escapeHtml(formatCents(subtotal))}</span>
        </div>
        <p class="cart-summary-note">Shipping calculated at checkout.</p>
        <button class="pay-btn pay-stripe" id="cartCheckoutBtn" type="button">Checkout</button>
      </div>
    `;

    bindCartEvents(validRows);
  } catch (error) {
    pageRoot.innerHTML = `<div class="cart-empty cart-empty-error">${escapeHtml(error.message || 'Unable to load cart')}</div>`;
  }
}

async function resolveCartItem(item) {
  const res = await fetch(`/api/products/${encodeURIComponent(item.productId)}`, { cache: 'no-store' });
  const payload = await res.json();

  if (!res.ok) {
    throw new Error(payload.error || 'Failed to load cart item');
  }

  const product = payload.data;

  if (product.soldOut) {
    removeFromCart(item.productId, item.variantId);
    return null;
  }

  const variant =
    (product.variants || []).find((entry) => String(entry.id) === String(item.variantId)) ||
    findVariant(product, { color: item.color, size: item.size });

  if (!variant?.price) {
    removeFromCart(item.productId, item.variantId);
    return null;
  }

  const image = pickImage(product.images || []);

  return {
    productId: product.id,
    variantId: variant.id,
    color: item.color || '',
    size: item.size || '',
    quantity: item.quantity || 1,
    title: product.title,
    price: variant.price,
    imageSrc: item.imageSrc || image?.src || ''
  };
}

function renderCartRow(row) {
  const variantLabel = [row.color, row.size].filter(Boolean).join(' · ');

  return `
    <li class="cart-item" data-product-id="${escapeHtml(row.productId)}" data-variant-id="${escapeHtml(row.variantId)}">
      <a class="cart-item-image" href="${productUrl(row.productId, row.imageSrc)}">
        ${
          row.imageSrc
            ? `<img src="${escapeHtml(row.imageSrc)}" alt="" width="120" height="160" loading="lazy" decoding="async">`
            : '<div class="cart-item-placeholder">&#9830;</div>'
        }
      </a>
      <div class="cart-item-details">
        <a class="cart-item-title" href="${productUrl(row.productId, row.imageSrc)}">${formatProductTitleMarkup(row.title)}</a>
        ${variantLabel ? `<p class="cart-item-variant">${escapeHtml(variantLabel)}</p>` : ''}
        <p class="cart-item-price">${escapeHtml(formatCents(row.price))}</p>
        <div class="cart-item-actions">
          <label class="cart-qty-label" for="qty-${escapeHtml(row.productId)}-${escapeHtml(row.variantId)}">Qty</label>
          <input
            class="cart-qty-input"
            id="qty-${escapeHtml(row.productId)}-${escapeHtml(row.variantId)}"
            type="number"
            min="1"
            max="10"
            value="${row.quantity}"
          >
          <button class="cart-remove-btn" type="button">Remove</button>
        </div>
      </div>
      <p class="cart-item-total">${escapeHtml(formatCents(row.price * row.quantity))}</p>
    </li>
  `;
}

function bindCartEvents(rows) {
  pageRoot.querySelectorAll('.cart-item').forEach((itemEl) => {
    const productId = itemEl.dataset.productId;
    const variantId = itemEl.dataset.variantId;
    const qtyInput = itemEl.querySelector('.cart-qty-input');

    qtyInput?.addEventListener('change', () => {
      const quantity = Number(qtyInput.value);
      updateCartQuantity(productId, variantId, quantity);
      renderCart();
    });

    itemEl.querySelector('.cart-remove-btn')?.addEventListener('click', () => {
      removeFromCart(productId, variantId);
      renderCart();
    });
  });

  document.getElementById('cartCheckoutBtn')?.addEventListener('click', () => handleCheckout(rows));
}

async function handleCheckout(rows) {
  startCheckout({
    items: rows.map((row) => ({
      productId: row.productId,
      variantId: row.variantId,
      color: row.color,
      size: row.size,
      quantity: row.quantity
    }))
  });
}
