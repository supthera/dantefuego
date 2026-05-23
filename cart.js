import { initFonts, preloadCursors } from './js/site.js';
import {
  clearCart,
  getCart,
  initCartBadge,
  removeFromCart,
  updateCartQuantity
} from './js/cart.js';
import { renderCartLine, resolveLineItem } from './js/cart-lines.js';
import { startCheckout } from './js/checkout-flow.js';
import { escapeHtml, formatCents } from './js/product-utils.js';

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
        ${validRows.map((row) => renderCartLine(row)).join('')}
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
  const row = await resolveLineItem(item);
  if (!row) {
    removeFromCart(item.productId, item.variantId);
  }
  return row;
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

function handleCheckout(rows) {
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
