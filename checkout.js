import { initFonts, preloadCursors } from './js/site.js';
import { clearCart, initCartBadge } from './js/cart.js';
import { renderOrderSummary, resolveCheckoutLines } from './js/cart-lines.js';
import { clearPendingCheckout, readPendingCheckout } from './js/checkout-flow.js';
import { escapeHtml } from './js/product-utils.js';

initFonts();
preloadCursors();
initCartBadge();

const params = new URLSearchParams(window.location.search);
const contentEl = document.getElementById('checkoutContent');

const sessionId = params.get('session_id');
const isCompleteReturn = params.get('checkout') === 'complete' && sessionId;

if (isCompleteReturn) {
  handleReturn(sessionId);
} else if (params.get('checkout') === 'complete') {
  showSuccess(null);
} else {
  if (params.has('checkout') || params.has('session_id')) {
    history.replaceState({}, '', '/checkout.html');
  }
  mountCheckout();
}

async function handleReturn(sessionId) {
  showLoading('Confirming your order...');

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
      history.replaceState({}, '', '/checkout.html');
      mountCheckout();
      return;
    }

    if (payload.status === 'complete') {
      clearPendingCheckout();
      clearCart();
      history.replaceState({}, '', '/checkout.html?checkout=complete');
      showSuccess(payload.customer_email);
      return;
    }

    throw new Error('Checkout was not completed');
  } catch (error) {
    showError(error.message || 'Unable to confirm order', '/checkout.html');
  }
}

async function mountCheckout() {
  const payload = readPendingCheckout();

  if (!payload) {
    contentEl.innerHTML = `
      <div class="cart-empty">
        <p>Nothing to checkout.</p>
        <a class="cart-empty-link" href="/#products">Browse the collection</a>
      </div>
    `;
    return;
  }

  contentEl.innerHTML = '<div class="cart-loading">Loading checkout...</div>';

  try {
    const rows = await resolveCheckoutLines(payload);

    if (!rows.length) {
      clearPendingCheckout();
      contentEl.innerHTML = `
        <div class="cart-empty">
          <p>These items are no longer available.</p>
          <a class="cart-empty-link" href="/cart.html">Return to cart</a>
        </div>
      `;
      return;
    }

    contentEl.innerHTML = `
      <div class="checkout-layout">
        ${renderOrderSummary(rows)}
        <section class="checkout-payment" aria-label="Payment">
          <p class="checkout-payment-label">Payment &amp; shipping</p>
          <div id="checkoutEmbedded" class="checkout-embedded"></div>
        </section>
      </div>
    `;

    const configRes = await fetch('/api/checkout/config', { cache: 'no-store' });
    const config = await configRes.json();

    if (!configRes.ok || !config.publishableKey) {
      throw new Error(config.error || 'Checkout is not configured');
    }

    if (typeof Stripe !== 'function') {
      throw new Error('Stripe failed to load');
    }

    const stripe = Stripe(config.publishableKey);
    const checkoutPayload = payload;

    const fetchClientSecret = async () => {
      const sessionRes = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload)
      });
      const session = await sessionRes.json();

      if (!sessionRes.ok || !session.clientSecret) {
        throw new Error(session.error || 'Unable to start checkout');
      }

      return session.clientSecret;
    };

    const mountEmbeddedCheckout =
      stripe.createEmbeddedCheckoutPage?.bind(stripe) || stripe.initEmbeddedCheckout?.bind(stripe);

    if (!mountEmbeddedCheckout) {
      throw new Error('Stripe embedded checkout is unavailable');
    }

    const checkout = await mountEmbeddedCheckout({ fetchClientSecret });
    checkout.mount('#checkoutEmbedded');
  } catch (error) {
    showError(error.message || 'Unable to start checkout', '/cart.html');
  }
}

function showLoading(message) {
  contentEl.innerHTML = `<div class="cart-loading">${escapeHtml(message)}</div>`;
}

function showSuccess(customerEmail) {
  const emailLine = customerEmail
    ? `<p class="cart-notice cart-notice-success">Confirmation sent to ${escapeHtml(customerEmail)}.</p>`
    : '<p class="cart-notice cart-notice-success">A receipt and invoice will be emailed to you shortly.</p>';

  contentEl.innerHTML = `
    <div class="checkout-success">
      ${emailLine}
      <p class="checkout-success-copy">Your payment was received. We will fulfill your order shortly.</p>
      <a class="cart-empty-link" href="/#products">Continue shopping</a>
    </div>
  `;
}

function showError(message, backHref) {
  contentEl.innerHTML = `
    <div class="cart-empty cart-empty-error">
      <p>${escapeHtml(message)}</p>
      <a class="cart-empty-link" href="${escapeHtml(backHref)}">Go back</a>
    </div>
  `;
}
