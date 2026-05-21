import { initCursor, initFonts } from './js/site.js';
import {
  escapeHtml,
  formatPrice,
  getOptionValues,
  pickImage,
  productUrl
} from './js/product-utils.js';

gsap.registerPlugin(ScrollTrigger);

initFonts();
initCursor();

const API_URL = '/api/products';

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

gsap.from('.collection-eyebrow, .collection-title, .collection-subtitle', {
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
    const res = await fetch(API_URL);
    const payload = await res.json();

    if (!res.ok) {
      throw new Error(payload.error || 'Failed to fetch products');
    }

    renderProducts(payload.data || []);
  } catch (error) {
    grid.innerHTML = `<div class="loading loading-error">${escapeHtml(error.message || 'Unable to load collection')}</div>`;
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!products.length) {
    grid.innerHTML = '<div class="loading">No products found</div>';
    return;
  }

  grid.innerHTML = products
    .map((product) => {
      const img = pickImage(product.images);
      const price = formatPrice(product.variants || []);

      return `<a class="product-card" href="${productUrl(product.id)}">
      <div class="product-img-wrap">
        ${img ? `<img class="product-img" src="${escapeHtml(img.src)}" alt="${escapeHtml(product.title)}" loading="lazy">` : `<div class="product-img-placeholder"><span>&#9830;</span></div>`}
        <div class="product-overlay"><span class="product-card-cta">View Product</span></div>
      </div>
      <div class="product-info">
        <p class="product-name">${escapeHtml(product.title)}</p>
        <p class="product-price">${escapeHtml(price)}</p>
      </div>
    </a>`;
    })
    .join('');

  gsap.utils.toArray('.product-card').forEach((card, i) => {
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

loadProducts();
