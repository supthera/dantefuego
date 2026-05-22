import { initFonts, preloadCursors } from './js/site.js';
import { MOCK_PRODUCTS, animateProductCards, renderProductGrid } from './js/render-product-card.js';
import { escapeHtml, preloadImage } from './js/product-utils.js';

gsap.registerPlugin(ScrollTrigger);

preloadCursors();

const heroLogoPin = document.getElementById('heroLogoPin');

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

let heroScrollReady = false;
let heroScrollTrigger = null;

function setHeroProgress(progress) {
  if (!heroLogoPin) return;
  const clamped = Math.min(1, Math.max(0, progress));
  heroLogoPin.style.setProperty('--hero-progress', clamped.toFixed(4));
}

function readHeroProgress() {
  if (heroScrollTrigger) return heroScrollTrigger.progress;
  const hero = document.getElementById('hero');
  if (!hero) return 0;

  const scrollRange = Math.max(hero.offsetHeight, 1);
  return Math.min(1, Math.max(0, window.scrollY / scrollRange));
}

function applyHeroProgress(progress = readHeroProgress()) {
  setHeroProgress(progress);
}

function initHeroScroll() {
  if (heroScrollReady) return;
  heroScrollReady = true;

  gsap.set('#heroLogoPin', { clearProps: 'transform,opacity,filter' });
  setHeroProgress(0);

  heroScrollTrigger = ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    invalidateOnRefresh: true,
    onUpdate: (self) => setHeroProgress(self.progress),
    onRefresh: (self) => setHeroProgress(self.progress)
  });

  gsap.to('#siteHeader', {
    opacity: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: '25% top',
      end: 'bottom top',
      scrub: true,
      invalidateOnRefresh: true
    }
  });
}

function syncHeroScroll() {
  if (!heroScrollReady) return;
  ScrollTrigger.refresh();
  ScrollTrigger.update();
  applyHeroProgress();
}

function scrollToHashTarget() {
  const hash = location.hash;
  if (!hash) return false;

  const target = document.querySelector(hash);
  if (!target) return false;

  target.scrollIntoView({ block: 'start' });
  return true;
}

async function bootHeroScroll() {
  await initFonts();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  initHeroScroll();
  scrollToHashTarget();
  syncHeroScroll();
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncHeroScroll, 150);
});

window.addEventListener('load', syncHeroScroll);
window.addEventListener('pageshow', syncHeroScroll);

window.addEventListener(
  'scroll',
  () => {
    if (window.scrollY > 2) return;
    applyHeroProgress(0);
  },
  { passive: true }
);

window.visualViewport?.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncHeroScroll, 150);
});

bootHeroScroll();

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
  initProductPrefetch();
  animateProductCards();
  syncHeroScroll();
}

const prefetchedProducts = new Set();

function initProductPrefetch() {
  const grid = document.getElementById('productsGrid');
  if (!grid || grid.dataset.prefetchBound) return;

  grid.dataset.prefetchBound = '1';
  grid.addEventListener(
    'pointerenter',
    (event) => {
      const card = event.target.closest('.df-card[data-product-id]');
      if (!card) return;

      const id = card.dataset.productId;
      if (!id || prefetchedProducts.has(id)) return;
      prefetchedProducts.add(id);

      fetch(`/api/products/${encodeURIComponent(id)}`, { cache: 'no-store' });

      const img = card.querySelector('.df-img');
      if (img?.src) preloadImage(img.src);
    },
    true
  );
}

loadProducts();
