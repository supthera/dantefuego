const CHECKOUT_KEY = 'df-checkout-pending';

export function startCheckout(payload) {
  sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(payload));
  window.location.href = '/checkout.html';
}

export function readPendingCheckout() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (payload?.items?.length || payload?.productId) return payload;
    return null;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  sessionStorage.removeItem(CHECKOUT_KEY);
}
