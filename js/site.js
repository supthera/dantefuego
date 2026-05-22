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
  if (!cursor) return;

  const prefersFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!prefersFinePointer) return;

  const img = cursor.querySelector('img');
  const hotspotX = 0;
  const hotspotY = 3;
  const scale = 48 / 32;

  function moveCursor(clientX, clientY) {
    cursor.style.transform = `translate(${clientX - hotspotX * scale}px, ${clientY - hotspotY * scale}px)`;
  }

  function showCursor() {
    cursor.classList.add('is-ready');
  }

  if (img?.complete && img.naturalWidth > 0) {
    showCursor();
  } else if (img) {
    img.addEventListener('load', showCursor, { once: true });
    img.addEventListener('error', () => {
      cursor.style.display = 'none';
      document.body.style.cursor = 'auto';
    }, { once: true });
  } else {
    showCursor();
  }

  document.addEventListener('mousemove', (e) => moveCursor(e.clientX, e.clientY), { passive: true });
  document.addEventListener('mouseenter', (e) => moveCursor(e.clientX, e.clientY));
}
