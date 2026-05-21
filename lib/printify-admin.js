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

function isStuckPublishing(product) {
  if (product.is_locked) return true;

  const external = product.external;
  if (!external) return false;

  if (Array.isArray(external)) {
    return external.length === 0;
  }

  if (typeof external === 'object') {
    return !external.id && !external.handle;
  }

  return false;
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

export async function deletePrintifyProduct({ token, shopId, productId }) {
  const resolvedShopId = await resolveShopId(token, shopId);
  const url = `${PRINTIFY_API}/shops/${resolvedShopId}/products/${productId}.json`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: printifyHeaders(token)
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Delete failed for ${productId}: ${res.status} ${body.slice(0, 200)}`);
  }

  return true;
}

export async function setProductLiveTag({ token, shopId, productId, tag = 'site-live' }) {
  const resolvedShopId = await resolveShopId(token, shopId);
  const url = `${PRINTIFY_API}/shops/${resolvedShopId}/products/${productId}.json`;

  const getRes = await fetch(url, { headers: printifyHeaders(token) });
  if (!getRes.ok) {
    const body = await getRes.text();
    throw new Error(`Fetch failed for ${productId}: ${getRes.status} ${body.slice(0, 200)}`);
  }

  const product = await getRes.json();
  const tags = [...new Set([...(product.tags || []), tag])];

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: printifyHeaders(token),
    body: JSON.stringify({ tags })
  });

  if (!putRes.ok) {
    const body = await putRes.text();
    throw new Error(`Tag update failed for ${productId}: ${putRes.status} ${body.slice(0, 200)}`);
  }

  return { id: product.id, title: product.title, tags };
}

export async function setLiveTagsOnProducts({ token, shopId, productIds, tag = 'site-live' }) {
  const results = await Promise.all(
    productIds.map(async (productId) => {
      try {
        const updated = await setProductLiveTag({ token, shopId, productId, tag });
        return { ...updated, status: 'tagged' };
      } catch (error) {
        return { id: productId, status: 'error', error: error.message };
      }
    })
  );

  return { tag, results };
}

export async function unlockStuckPrintifyProducts({ token, shopId, productIds = [] }) {
  const { shopId: resolvedShopId, products } = await fetchAllPrintifyProductsRaw({ token, shopId });
  const targets = productIds.length
    ? products.filter((product) => productIds.includes(String(product.id)))
    : products.filter(isStuckPublishing);

  const results = await Promise.all(
    targets.map(async (product) => {
      try {
        await unlockPrintifyProduct({
          token,
          shopId: resolvedShopId,
          productId: product.id
        });

        return {
          id: product.id,
          title: product.title,
          status: 'unlocked'
        };
      } catch (error) {
        return {
          id: product.id,
          title: product.title,
          status: 'error',
          error: error.message
        };
      }
    })
  );

  return {
    shop_id: resolvedShopId,
    scanned: products.length,
    targeted: targets.length,
    results
  };
}
