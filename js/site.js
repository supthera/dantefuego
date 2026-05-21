export function initFonts() {
  return Promise.race([
    document.fonts.load('1em BertholdFraktur'),
    new Promise((resolve) => setTimeout(resolve, 2500))
  ]).finally(() => {
    document.documentElement.classList.remove('fonts-pending');
  });
}

export function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  if (!cursor || !ring) return;

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
  });

  function tickRing() {
    ringX += (mouseX - ringX - 16) * 0.12;
    ringY += (mouseY - ringY - 16) * 0.12;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(tickRing);
  }

  tickRing();

  document.querySelectorAll('button, a, select').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      ring.style.width = '48px';
      ring.style.height = '48px';
      ring.style.borderColor = 'rgba(204,0,0,0.8)';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.width = '32px';
      ring.style.height = '32px';
      ring.style.borderColor = 'rgba(204,0,0,0.4)';
    });
  });
}
