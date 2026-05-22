import { getPrintifyEnv } from './env.js';
import { resolvePrintifyShopId } from './printify.js';

const PRINTIFY_API = 'https://api.printify.com/v1';

export async function submitPrintifyOrder(env, { session, lineItems }) {
  const { token, shopId } = getPrintifyEnv(env);
  if (!token) {
    throw new Error('Missing PRINTIFY_TOKEN');
  }

  const resolvedShopId = await resolvePrintifyShopId(token, shopId);
  const addressTo = stripeSessionToPrintifyAddress(session);

  if (!addressTo.address1 || !addressTo.city || !addressTo.zip || !addressTo.country) {
    throw new Error('Incomplete shipping address for Printify order');
  }

  const printifyLineItems = lineItems
    .map((item, index) => {
      const productId = item?.product_id;
      const variantId = Number(item?.variant_id);

      if (!productId || !Number.isFinite(variantId)) {
        return null;
      }

      return {
        product_id: String(productId),
        variant_id: variantId,
        quantity: Math.max(1, Number(item?.quantity) || 1),
        external_id: `${session.id}-line-${index}`
      };
    })
    .filter(Boolean);

  if (!printifyLineItems.length) {
    throw new Error('Missing Printify product or variant in order metadata');
  }

  const body = {
    external_id: session.id,
    line_items: printifyLineItems,
    shipping_method: 1,
    send_shipping_notification: true,
    address_to: addressTo
  };

  const res = await fetch(`${PRINTIFY_API}/shops/${resolvedShopId}/orders.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'dantefuego.com'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printify order API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return { printify_order_id: data.id };
}

function stripeSessionToPrintifyAddress(session) {
  const shipping = session.shipping_details || {};
  const customer = session.customer_details || {};
  const address = shipping.address || customer.address || {};
  const { firstName, lastName } = splitName(shipping.name || customer.name || '');

  return {
    first_name: firstName || 'Customer',
    last_name: lastName || 'Customer',
    email: customer.email || session.customer_email || '',
    phone: customer.phone || '',
    country: address.country || 'US',
    region: address.state || '',
    address1: address.line1 || '',
    address2: address.line2 || '',
    city: address.city || '',
    zip: address.postal_code || ''
  };
}

function splitName(fullName) {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
