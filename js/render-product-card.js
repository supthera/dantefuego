import { escapeHtml, formatPrice, formatProductTitleMarkup, pickImage, productUrl } from './product-utils.js';

export const MOCK_PRODUCTS = [
  {
    id: 'demo-inferno-tee',
    title: 'Inferno Mini Chest Script Tee',
    images: [],
    options: [
      {
        type: 'color',
        values: [{ title: 'Black' }, { title: 'White' }, { title: 'Dark Red' }]
      },
      {
        type: 'size',
        values: [{ title: 'S' }, { title: 'M' }, { title: 'L' }, { title: 'XL' }, { title: '2XL' }]
      }
    ],
    variants: [{ id: 1, price: 2999 }],
    badge: 'New',
    placeholderGlyph: '&#9830;'
  },
  {
    id: 'demo-dante-tee',
    title: 'Dante Alighieri Typography Tee',
    images: [],
    options: [
      {
        type: 'color',
        values: [{ title: 'Black' }, { title: 'Charcoal' }]
      },
      {
        type: 'size',
        values: [{ title: 'S' }, { title: 'M' }, { title: 'L' }, { title: 'XL' }, { title: '2XL' }, { title: '3XL' }]
      }
    ],
    variants: [{ id: 2, price: 3499 }],
    placeholderGlyph: '&#9674;'
  }
];

export function renderProductCard(product) {
  const img = pickImage(product.images);
  const price = formatPrice(product.variants || []);
  const badge = product.badge
    ? `<div class="df-badge">${escapeHtml(product.badge)}</div>`
    : '';
  const placeholder = product.placeholderGlyph || '&#9830;';

  const imageMarkup = img
    ? `<img class="df-img" src="${escapeHtml(img.src)}" alt="${escapeHtml(product.title)}" width="900" height="1200" loading="lazy" decoding="async">`
    : `<div class="df-img-placeholder">${placeholder}</div>`;

  return `<a class="df-card" href="${productUrl(product.id, img?.src)}" data-product-id="${escapeHtml(product.id)}">
    <div class="df-img-wrap">
      ${imageMarkup}
      <div class="df-ember df-ember-1"></div>
      <div class="df-ember df-ember-2"></div>
      <div class="df-ember df-ember-3"></div>
      ${badge}
      <div class="df-overlay"><span class="df-overlay-btn">View Product</span></div>
    </div>
    <div class="df-info">
      <p class="df-name">${formatProductTitleMarkup(product.title)}</p>
      <div class="df-divider"></div>
      <div class="df-meta">
        <span class="df-price">${escapeHtml(price)}</span>
      </div>
    </div>
  </a>`;
}

export function renderProductGrid(products) {
  return products.map((product) => renderProductCard(product)).join('');
}

export function animateProductCards() {
  gsap.utils.toArray('.df-card').forEach((card, i) => {
    gsap.to(card, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: (i % 3) * 0.1,
      scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' }
    });
  });
}
