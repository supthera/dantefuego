export function initFonts() {
  return Promise.race([
    document.fonts.load('1em BertholdFraktur'),
    new Promise((resolve) => setTimeout(resolve, 2500))
  ]).finally(() => {
    document.documentElement.classList.remove('fonts-pending');
  });
}

const CURSOR_SETS = {
  gun: 8,
  flame: 7,
  banana: 8
};

export function preloadCursors() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const sets = document.body.classList.contains('page-product')
    ? ['cursor-flame', 'cursor-banana']
    : ['cursor-gun'];

  for (const set of sets) {
    const key = set.replace('cursor-', '');
    const count = CURSOR_SETS[key] || 0;
    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = `/assets/${set}/${i}.png`;
    }
  }
}
