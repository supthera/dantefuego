const PRINTIFY_API = 'https://api.printify.com/v1';

export async function fetchPrintifyProducts({ token, shopId }) {
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

  return products
    .filter((product) => product.visible !== false)
    .filter((product) => (product.variants || []).some((variant) => variant.is_enabled))
    .map(normalizeProduct);
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

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
