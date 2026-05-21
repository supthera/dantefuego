const PRINTIFY_API = 'https://api.printify.com/v1';

function printifyHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'dantefuego.com',
    'Content-Type': 'application/json'
  };
}

async function resolveShopId(token, shopId) {
  if (shopId) return String(shopId);

  const res = await fetch(`${PRINTIFY_API}/shops.json`, {
    headers: printifyHeaders(token)
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

export async function fetchAllPrintifyProductsRaw({ token, shopId }) {
  const resolvedShopId = await resolveShopId(token, shopId);
  const products = [];
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage) {
    const url = `${PRINTIFY_API}/shops/${resolvedShopId}/products.json?page=${page}&limit=50`;
    const res = await fetch(url, { headers: printifyHeaders(token) });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Printify API ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    products.push(...(json.data || []));
    lastPage = json.last_page || 1;
    page += 1;
  }

  return { shopId: resolvedShopId, products };
}

export async function unlockPrintifyProduct({ token, shopId, productId, reason }) {
  const resolvedShopId = await resolveShopId(token, shopId);
  const url = `${PRINTIFY_API}/shops/${resolvedShopId}/products/${productId}/publishing_failed.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: printifyHeaders(token),
    body: JSON.stringify({
      reason: reason || 'Custom API store — clear stuck publishing lock'
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unlock failed for ${productId}: ${res.status} ${body.slice(0, 200)}`);
  }

  return true;
}

export async function unlockStuckPrintifyProducts({ token, shopId, productIds = [] }) {
  const { shopId: resolvedShopId, products } = await fetchAllPrintifyProductsRaw({ token, shopId });
  const targets = productIds.length
    ? products.filter((product) => productIds.includes(String(product.id)))
    : products.filter((product) => product.is_locked);

  const results = [];

  for (const product of targets) {
    try {
      await unlockPrintifyProduct({
        token,
        shopId: resolvedShopId,
        productId: product.id
      });

      results.push({
        id: product.id,
        title: product.title,
        status: 'unlocked'
      });
    } catch (error) {
      results.push({
        id: product.id,
        title: product.title,
        status: 'error',
        error: error.message
      });
    }
  }

  return {
    shop_id: resolvedShopId,
    scanned: products.length,
    targeted: targets.length,
    results
  };
}
