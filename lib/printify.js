import { DEFAULT_LIVE_PRODUCT_TAG } from './env.js';

const PRINTIFY_API = 'https://api.printify.com/v1';

export function hasLiveProductTag(product, liveTag = DEFAULT_LIVE_PRODUCT_TAG) {
  const needle = (liveTag || DEFAULT_LIVE_PRODUCT_TAG).toLowerCase();
  return (product.tags || []).some((tag) => String(tag).toLowerCase() === needle);
}

export function isHiddenProduct(product, hiddenProductIds = []) {
  if (!hiddenProductIds.length) return false;
  return hiddenProductIds.includes(String(product.id));
}

function filterCatalogProducts(products, { liveTag, hiddenProductIds }) {
  return products
    .filter((product) => product.visible !== false)
    .filter((product) => !isHiddenProduct(product, hiddenProductIds))
    .filter((product) => hasLiveProductTag(product, liveTag))
    .filter((product) => (product.variants || []).some((variant) => variant.is_enabled));
}

export async function fetchPrintifyProducts({ token, shopId, liveTag, hiddenProductIds = [] }) {
  if (!token) {
    throw new Error('Missing PRINTIFY_TOKEN');
  }

  const resolvedShopId = shopId || (await fetchDefaultShopId(token));

  const products = [];
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage) {
    const url = `${PRINTIFY_API}/shops/${resolvedShopId}/products.json?page=${page}&limit=50`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'dantefuego.com'
      }
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Printify API ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    products.push(...(json.data || []));
    lastPage = json.last_page || 1;
    page += 1;
  }

  return filterCatalogProducts(products, { liveTag, hiddenProductIds }).map(normalizeProduct);
}

export async function fetchPrintifyProduct({
  token,
  shopId,
  productId,
  liveTag,
  hiddenProductIds = []
}) {
  if (!token) {
    throw new Error('Missing PRINTIFY_TOKEN');
  }

  if (!productId) {
    throw new Error('Missing product id');
  }

  const resolvedShopId = shopId || (await fetchDefaultShopId(token));
  const url = `${PRINTIFY_API}/shops/${resolvedShopId}/products/${productId}.json`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'dantefuego.com'
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Printify API ${res.status}: ${body.slice(0, 200)}`);
  }

  const product = await res.json();

  if (product.visible === false) {
    throw new Error('Product not found');
  }

  if (isHiddenProduct(product, hiddenProductIds)) {
    throw new Error('Product not found');
  }

  if (!hasLiveProductTag(product, liveTag)) {
    throw new Error('Product not found');
  }

  if (!(product.variants || []).some((variant) => variant.is_enabled)) {
    throw new Error('Product not available');
  }

  return normalizeProduct(product);
}

async function fetchDefaultShopId(token) {
  const res = await fetch(`${PRINTIFY_API}/shops.json`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'dantefuego.com'
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Printify shops API ${res.status}: ${body.slice(0, 200)}`);
  }

  const shops = await res.json();
  if (!shops.length) {
    throw new Error('No Printify shops found for this token');
  }

  return String(shops[0].id);
}

function normalizeProduct(product) {
  const enabledVariants = (product.variants || []).filter((variant) => variant.is_enabled);

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    images: product.images || [],
    options: product.options || [],
    variants: enabledVariants.map((variant) => ({
      id: variant.id,
      price: variant.price,
      title: variant.title,
      is_enabled: variant.is_enabled,
      is_default: variant.is_default,
      options: variant.options
    }))
  };
}

export function jsonResponse(body, status = 200, { cacheControl = 'public, max-age=300' } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl
    }
  });
}
