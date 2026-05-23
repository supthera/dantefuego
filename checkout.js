import { initFonts, preloadCursors } from './js/site.js';
import { clearCart, initCartBadge } from './js/cart.js';
import { clearPendingCheckout, readPendingCheckout } from './js/checkout-flow.js';
import { escapeHtml } from './js/product-utils.js';

initFonts();
preloadCursors();
initCartBadge();

const params = new URLSearchParams(window.location.search);
const stateEl = document.getElementById('checkoutState');
const embeddedEl = document.getElementById('checkoutEmbedded');

if (params.get('checkout') === 'complete' && params.get('session_id')) {
  handleReturn(params.get('session_id'));
} else {
  mountCheckout();
}

async function handleReturn(sessionId) {
  showState('<p class="checkout-loading">Confirming your order...</p>');

  try {
    const res = await fetch(
      `/api/checkout/session-status?session_id=${encodeURIComponent(sessionId)}`,
      { cache: 'no-store' }
    );
    const payload = await res.json();

    if (!res.ok) {
      throw new Error(payload.error || 'Unable to confirm order');
    }

    if (payload.status === 'open') {
      clearPendingCheckout();
      window.location.replace('/checkout.html');
      return;
    }

    if (payload.status === 'complete') {
      clearPendingCheckout();
      clearCart();

      const emailLine = payload.customer_email
        ? `<p class="checkout-success-email">Confirmation sent to ${escapeHtml(payload.customer_email)}.</p>`
        : '<p class="checkout-success-email">A receipt and invoice will be emailed to you shortly.</p>';

      showState(`
        <div class="checkout-success">
          <p class="collection-eyebrow">Order confirmed</p>
          <h1 class="checkout-title">Thank you</h1>
          <p class="checkout-success-copy">Your payment was received. We will fulfill your order shortly.</p>
          ${emailLine}
          <a class="checkout-back-link" href="/#products">Continue shopping</a>
        </div>
      `);
      return;
    }

    throw new Error('Checkout was not completed');
  } catch (error) {
    showState(`
      <div class="checkout-error">
        <p>${escapeHtml(error.message || 'Unable to confirm order')}</p>
        <a class="checkout-back-link" href="/checkout.html">Return to checkout</a>
      </div>
    `);
  }
}

async function mountCheckout() {
  const payload = readPendingCheckout();

  if (!payload) {
    showState(`
      <div class="checkout-empty">
        <p>Nothing to checkout.</p>
        <a class="checkout-back-link" href="/#products">Browse the collection</a>
      </div>
    `);
    return;
  }

  showState(`
    <p class="collection-eyebrow">Secure checkout</p>
    <h1 class="checkout-title">Complete your order</h1>
    <p class="checkout-lead">Enter shipping and payment below. You will receive a receipt and invoice by email.</p>
  `);

  embeddedEl.hidden = false;

  try {
    const configRes = await fetch('/api/checkout/config', { cache: 'no-store' });
    const config = await configRes.json();

    if (!configRes.ok || !config.publishableKey) {
      throw new Error(config.error || 'Checkout is not configured');
    }

    const sessionRes = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const session = await sessionRes.json();

    if (!sessionRes.ok || !session.clientSecret) {
      throw new Error(session.error || 'Unable to start checkout');
    }

    if (typeof Stripe !== 'function') {
      throw new Error('Stripe failed to load');
    }

    const stripe = Stripe(config.publishableKey);
    const checkout = await stripe.initEmbeddedCheckout({
      clientSecret: session.clientSecret
    });

    checkout.mount('#checkoutEmbedded');
  } catch (error) {
    embeddedEl.hidden = true;
    showState(`
      <div class="checkout-error">
        <p>${escapeHtml(error.message || 'Unable to start checkout')}</p>
        <a class="checkout-back-link" href="/cart.html">Back to cart</a>
      </div>
    `);
  }
}

function showState(markup) {
  stateEl.innerHTML = markup;
}
