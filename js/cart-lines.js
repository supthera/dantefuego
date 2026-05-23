import {
  escapeHtml,
  findVariant,
  formatCents,
  formatProductTitleMarkup,
  pickImage,
  productUrl
} from './product-utils.js';

export function getCheckoutItems(payload) {
  if (Array.isArray(payload?.items) && payload.items.length) return payload.items;
  if (payload?.productId) return [payload];
  return [];
}

export async function resolveLineItem(item) {
  const res = await fetch(`/api/products/${encodeURIComponent(item.productId)}`, { cache: 'no-store' });
  const payload = await res.json();

  if (!res.ok) {
    throw new Error(payload.error || 'Failed to load cart item');
  }

  const product = payload.data;
  if (product.soldOut) return null;

  const variant =
    (product.variants || []).find((entry) => String(entry.id) === String(item.variantId)) ||
    findVariant(product, { color: item.color, size: item.size });

  if (!variant?.price) return null;

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

export async function resolveCheckoutLines(checkoutPayload) {
  const items = getCheckoutItems(checkoutPayload);
  if (!items.length) return [];

  const rows = await Promise.all(items.map((item) => resolveLineItem(item)));
  return rows.filter(Boolean);
}

export function renderCartLine(row, { readonly = false } = {}) {
  const variantLabel = [row.color, row.size].filter(Boolean).join(' · ');
  const actionsMarkup = readonly
    ? `<p class="cart-item-qty">Qty ${row.quantity}</p>`
    : `
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
      `;

  return `
    <li class="cart-item${readonly ? ' cart-item-readonly' : ''}" data-product-id="${escapeHtml(row.productId)}" data-variant-id="${escapeHtml(row.variantId)}">
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
        ${actionsMarkup}
      </div>
      <p class="cart-item-total">${escapeHtml(formatCents(row.price * row.quantity))}</p>
    </li>
  `;
}

export function renderOrderSummary(rows) {
  const subtotal = rows.reduce((sum, row) => sum + row.price * row.quantity, 0);

  return `
    <section class="checkout-order" aria-label="Order summary">
      <ul class="cart-list">
        ${rows.map((row) => renderCartLine(row, { readonly: true })).join('')}
      </ul>
      <div class="cart-summary checkout-order-summary">
        <div class="cart-summary-row">
          <span>Subtotal</span>
          <span>${escapeHtml(formatCents(subtotal))}</span>
        </div>
        <p class="cart-summary-note">Shipping and tax calculated below.</p>
      </div>
    </section>
  `;
}
