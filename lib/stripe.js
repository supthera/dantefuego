import { findVariant } from '../js/product-utils.js';
import { fetchCatalogProduct } from './catalog.js';
import { getSiteUrl, getStripeEnv } from './env.js';

export async function createCheckoutSession(env, payload, request) {
  const { secretKey } = getStripeEnv(env);
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  const productId = payload?.productId;
  const variantId = payload?.variantId;
  const color = payload?.color || '';
  const size = payload?.size || '';

  if (!productId) {
    throw new Error('Missing productId');
  }

  const product = await fetchCatalogProduct(env, productId);
  let variant = null;

  if (variantId) {
    variant = (product.variants || []).find((entry) => String(entry.id) === String(variantId));
  }

  if (!variant) {
    variant = findVariant(product, { color, size });
  }

  if (!variant?.price) {
    throw new Error('Variant not available');
  }

  const siteUrl = getSiteUrl(env, request);
  const lineName = [product.title, color, size].filter(Boolean).join(' — ');
  const params = new URLSearchParams();

  params.set('mode', 'payment');
  params.set('success_url', `${siteUrl}/product.html?id=${encodeURIComponent(productId)}&checkout=success`);
  params.set('cancel_url', `${siteUrl}/product.html?id=${encodeURIComponent(productId)}&checkout=cancel`);
  params.set('shipping_address_collection[allowed_countries][0]', 'US');
  params.set('customer_creation', 'always');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'usd');
  params.set('line_items[0][price_data][unit_amount]', String(variant.price));
  params.set('line_items[0][price_data][product_data][name]', lineName);
  params.set('metadata[product_id]', String(product.id));
  params.set('metadata[variant_id]', String(variant.id));
  params.set('metadata[source]', product.source || 'printify');
  params.set('metadata[fulfillment]', product.fulfillment || 'printify');
  params.set('metadata[color]', color);
  params.set('metadata[size]', size);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  const session = await response.json();
  if (!response.ok) {
    throw new Error(session.error?.message || 'Failed to create checkout session');
  }

  return { url: session.url, id: session.id };
}
