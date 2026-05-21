import { initCursor, initFonts } from './js/site.js';
import { MOCK_PRODUCTS, animateProductCards, renderProductGrid } from './js/render-product-card.js';
import { escapeHtml } from './js/product-utils.js';

gsap.registerPlugin(ScrollTrigger);

initFonts();
initCursor();

const API_URL = '/api/products';
const USE_MOCKS =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  new URLSearchParams(location.search).has('mock');

const embersContainer = document.getElementById('embers');
for (let i = 0; i < 30; i++) {
  const ember = document.createElement('div');
  ember.className = 'ember';
  ember.style.cssText = `left:${Math.random() * 100}%;bottom:0;animation-duration:${4 + Math.random() * 8}s;animation-delay:${Math.random() * 6}s;--drift:${(Math.random() - 0.5) * 100}px;width:${1 + Math.random() * 2}px;height:${1 + Math.random() * 2}px;`;
  embersContainer.appendChild(ember);
}

gsap.to('#heroLogoPin', {
  scale: 0.25,
  filter: 'blur(24px)',
  opacity: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1.5
  }
});

gsap.to('#siteHeader', {
  opacity: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: '#hero',
    start: '25% top',
    end: 'bottom top',
    scrub: true
  }
});

gsap.from('.collection-eyebrow', {
  opacity: 0,
  y: 30,
  stagger: 0.15,
  duration: 1,
  ease: 'power2.out',
  scrollTrigger: { trigger: '.collection-header', start: 'top 80%' }
});

async function loadProducts() {
  const grid = document.getElementById('productsGrid');

  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    const payload = await res.json();

    if (!res.ok) {
      throw new Error(payload.error || 'Failed to fetch products');
    }

    const products = payload.data || [];
    if (!products.length && USE_MOCKS) {
      renderProducts(MOCK_PRODUCTS);
      return;
    }

    if (!products.length) {
      grid.innerHTML = '<div class="loading">No products found</div>';
      return;
    }

    renderProducts(products);
  } catch (error) {
    if (USE_MOCKS) {
      renderProducts(MOCK_PRODUCTS);
      return;
    }

    grid.innerHTML = `<div class="loading loading-error">${escapeHtml(error.message || 'Unable to load collection')}</div>`;
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = renderProductGrid(products);
  animateProductCards();
}

loadProducts();
