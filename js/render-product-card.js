import { escapeHtml, formatPrice, getOptionValues, pickImage, productUrl } from './product-utils.js';

const SWATCH_MAP = {
  black: '#1a1a1a',
  white: '#f0f0f0',
  'dark red': '#8b0000',
  charcoal: '#2c2c2c',
  red: '#8b0000',
  grey: '#6b6b6b',
  gray: '#6b6b6b'
};

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

function swatchColor(name) {
  return SWATCH_MAP[String(name).toLowerCase()] || '#555555';
}

function renderSwatches(colors) {
  if (!colors.length) return '';

  return `<div class="df-colors">${colors
    .map(
      (color) =>
        `<span class="df-swatch" style="background:${swatchColor(color)};" title="${escapeHtml(color)}"></span>`
    )
    .join('')}</div>`;
}

function renderSizes(sizes) {
  if (!sizes.length) return '';

  return `<div class="df-sizes">${sizes
    .map((size, index) => `<span class="df-size-tag${index === 0 ? ' active' : ''}">${escapeHtml(size)}</span>`)
    .join('')}</div>`;
}

export function renderProductCard(product) {
  const img = pickImage(product.images);
  const price = formatPrice(product.variants || []);
  const colors = getOptionValues(product, 'color');
  const sizes = getOptionValues(product, 'size');
  const badge = product.badge
    ? `<div class="df-badge">${escapeHtml(product.badge)}</div>`
    : '';
  const placeholder = product.placeholderGlyph || '&#9830;';

  const imageMarkup = img
    ? `<img class="df-img" src="${escapeHtml(img.src)}" alt="${escapeHtml(product.title)}" loading="lazy">`
    : `<div class="df-img-placeholder">${placeholder}</div>`;

  return `<a class="df-card" href="${productUrl(product.id)}">
    <div class="df-img-wrap">
      ${imageMarkup}
      <div class="df-ember df-ember-1"></div>
      <div class="df-ember df-ember-2"></div>
      <div class="df-ember df-ember-3"></div>
      ${badge}
      <div class="df-overlay"><span class="df-overlay-btn">View Product</span></div>
    </div>
    <div class="df-info">
      <p class="df-name">${escapeHtml(product.title)}</p>
      <div class="df-divider"></div>
      <div class="df-meta">
        <span class="df-price">${escapeHtml(price)}</span>
        ${renderSwatches(colors)}
      </div>
      ${renderSizes(sizes)}
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
