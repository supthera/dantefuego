import { findVariant } from '../js/product-utils.js';
import { fetchCatalogProduct } from './catalog.js';
import { getSiteUrl, getStripeEnv } from './env.js';

export async function createCheckoutSession(env, payload, request) {
  const { secretKey } = getStripeEnv(env);
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  const resolvedItems = await resolveCheckoutItems(env, payload);
  const siteUrl = getSiteUrl(env, request);
  const params = new URLSearchParams();
  const returnPath = payload?.items?.length ? '/cart.html' : `/product.html?id=${encodeURIComponent(resolvedItems[0].product.id)}`;

  params.set('mode', 'payment');
  params.set('success_url', `${siteUrl}${returnPath}?checkout=success`);
  params.set('cancel_url', `${siteUrl}${returnPath}?checkout=cancel`);
  params.set('shipping_address_collection[allowed_countries][0]', 'US');
  params.set('customer_creation', 'always');

  resolvedItems.forEach((entry, index) => {
    const { product, variant, color, size, quantity } = entry;
    const lineName = [product.title, color, size].filter(Boolean).join(' — ');

    params.set(`line_items[${index}][quantity]`, String(quantity));
    params.set(`line_items[${index}][price_data][currency]`, 'usd');
    params.set(`line_items[${index}][price_data][unit_amount]`, String(variant.price));
    params.set(`line_items[${index}][price_data][product_data][name]`, lineName);
  });

  const metadataItems = resolvedItems.map(({ product, variant, color, size, quantity }) => ({
    product_id: String(product.id),
    variant_id: String(variant.id),
    source: product.source || 'printify',
    fulfillment: product.fulfillment || 'printify',
    color,
    size,
    quantity
  }));

  params.set('metadata[line_items_json]', JSON.stringify(metadataItems));

  const first = metadataItems[0];
  params.set('metadata[product_id]', first.product_id);
  params.set('metadata[variant_id]', first.variant_id);
  params.set('metadata[source]', first.source);
  params.set('metadata[fulfillment]', first.fulfillment);
  params.set('metadata[color]', first.color);
  params.set('metadata[size]', first.size);

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

async function resolveCheckoutItems(env, payload) {
  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : payload?.productId
      ? [payload]
      : [];

  if (!rawItems.length) {
    throw new Error('No items to checkout');
  }

  const resolved = [];

  for (const item of rawItems) {
    const productId = item?.productId;
    const variantId = item?.variantId;
    const color = item?.color || '';
    const size = item?.size || '';
    const quantity = Math.max(1, Number(item?.quantity) || 1);

    if (!productId) {
      throw new Error('Missing productId');
    }

    const product = await fetchCatalogProduct(env, productId);

    if (product.soldOut) {
      throw new Error('Product is sold out');
    }

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

    resolved.push({ product, variant, color, size, quantity });
  }

  return resolved;
}
