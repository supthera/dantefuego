const CART_KEY = 'df-cart';

export function getCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('cart:updated'));
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
}

export function makeCartKey(productId, variantId) {
  return `${productId}:${variantId}`;
}

export function addToCart(item) {
  const cart = getCart();
  const key = makeCartKey(item.productId, item.variantId);
  const existing = cart.find((entry) => makeCartKey(entry.productId, entry.variantId) === key);

  if (existing) {
    existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    if (item.title) existing.title = item.title;
    if (item.price) existing.price = item.price;
    if (item.imageSrc) existing.imageSrc = item.imageSrc;
  } else {
    cart.push({
      productId: item.productId,
      variantId: item.variantId,
      color: item.color || '',
      size: item.size || '',
      quantity: item.quantity || 1,
      title: item.title || '',
      price: item.price || 0,
      imageSrc: item.imageSrc || ''
    });
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(productId, variantId) {
  const key = makeCartKey(productId, variantId);
  saveCart(getCart().filter((entry) => makeCartKey(entry.productId, entry.variantId) !== key));
}

export function updateCartQuantity(productId, variantId, quantity) {
  const key = makeCartKey(productId, variantId);
  const cart = getCart();
  const item = cart.find((entry) => makeCartKey(entry.productId, entry.variantId) === key);

  if (!item) return;

  if (quantity <= 0) {
    removeFromCart(productId, variantId);
    return;
  }

  item.quantity = quantity;
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

export function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;

  const count = getCartCount();
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

export function initCartBadge() {
  updateCartBadge();
  window.addEventListener('cart:updated', updateCartBadge);
  window.addEventListener('storage', (event) => {
    if (event.key === CART_KEY) updateCartBadge();
  });
}
