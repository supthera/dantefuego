gsap.registerPlugin(ScrollTrigger);

Promise.race([
  document.fonts.load('1em BertholdFraktur'),
  new Promise((resolve) => setTimeout(resolve, 2500))
]).finally(() => {
  document.documentElement.classList.remove('fonts-pending');
});

const API_URL = '/api/products';

const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mouseX = 0;
let mouseY = 0;
let ringX = 0;
let ringY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  gsap.set(cursor, { x: mouseX - 4, y: mouseY - 4 });
});

gsap.ticker.add(() => {
  ringX += (mouseX - ringX - 16) * 0.12;
  ringY += (mouseY - ringY - 16) * 0.12;
  gsap.set(ring, { x: ringX, y: ringY });
});

document.querySelectorAll('button, a, select').forEach((el) => {
  el.addEventListener('mouseenter', () =>
    gsap.to(ring, {
      width: 48,
      height: 48,
      borderColor: 'rgba(204,0,0,0.8)',
      duration: 0.2
    })
  );
  el.addEventListener('mouseleave', () =>
    gsap.to(ring, {
      width: 32,
      height: 32,
      borderColor: 'rgba(204,0,0,0.4)',
      duration: 0.2
    })
  );
});

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
    grid.innerHTML = `<div class="loading" style="animation:none;color:rgba(204,0,0,0.75)">${escapeHtml(error.message || 'Unable to load collection')}</div>`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPrice(variants) {
  const prices = variants.map((variant) => variant.price).filter(Boolean);
  if (!prices.length) return '';

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const minLabel = `$${(min / 100).toFixed(2)}`;

  return min === max ? minLabel : `${minLabel}+`;
}

function getOptionValues(product, type) {
  const option = (product.options || []).find((entry) => entry.type === type);
  return (option?.values || []).map((value) => value.title);
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!products.length) {
    grid.innerHTML = '<div class="loading">No products found</div>';
    return;
  }

  grid.innerHTML = products
    .map((product) => {
      const img =
        (product.images || []).find((image) => image.is_default) ||
        (product.images || []).find((image) => image.position === 'front') ||
        (product.images || [])[0];
      const variants = product.variants || [];
      const price = formatPrice(variants);
      const colors = getOptionValues(product, 'color');
      const sizes = getOptionValues(product, 'size');
      const safeData = JSON.stringify({
        id: product.id,
        title: product.title,
        price,
        colors,
        sizes,
        variants
      }).replace(/"/g, '&quot;');

      return `<div class="product-card" data-product="${safeData}">
      <div class="product-img-wrap">
        ${img ? `<img class="product-img" src="${escapeHtml(img.src)}" alt="${escapeHtml(product.title)}" loading="lazy">` : `<div class="product-img-placeholder"><span>&#9830;</span></div>`}
        <div class="product-overlay"><button class="product-buy-btn">Add to Order</button></div>
      </div>
      <div class="product-info">
        <p class="product-name">${escapeHtml(product.title)}</p>
        <p class="product-price">${escapeHtml(price)}</p>
      </div>
    </div>`;
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
    card.querySelector('.product-buy-btn').addEventListener('click', () => {
      openModal(JSON.parse(card.dataset.product.replace(/&quot;/g, '"')));
    });
  });
}

function openModal(product) {
  document.getElementById('modalProductName').textContent = product.title;
  document.getElementById('modalProductPrice').textContent = product.price;

  const colorSelect = document.getElementById('colorSelect');
  colorSelect.innerHTML =
    '<option value="">-- Choose Color --</option>' +
    (product.colors || []).map((color) => `<option>${escapeHtml(color)}</option>`).join('');

  const sizeSelect = document.getElementById('sizeSelect');
  const sizes = product.sizes || [];
  sizeSelect.innerHTML =
    sizes.length > 0
      ? '<option value="">-- Choose Size --</option>' +
        sizes.map((size) => `<option>${escapeHtml(size)}</option>`).join('')
      : '<option value="">-- Choose Size --</option><option>One Size</option>';

  document.getElementById('modalOverlay').classList.add('active');
  gsap.fromTo('.modal', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
}

function closeModal() {
  gsap.to('.modal', {
    y: 20,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => document.getElementById('modalOverlay').classList.remove('active')
  });
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('stripeBtn').addEventListener('click', () => {
  const size = document.getElementById('sizeSelect').value;
  const color = document.getElementById('colorSelect').value;
  if (!size || !color) {
    alert('Please select a size and color');
    return;
  }
  alert('Stripe checkout — coming soon!');
});

document.getElementById('cryptoBtn').addEventListener('click', () => alert('Crypto checkout — coming soon!'));
document.getElementById('paypalBtn').addEventListener('click', () => alert('PayPal checkout — coming soon!'));

loadProducts();
