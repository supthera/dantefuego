function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function initLogoGradients() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const fuegoParts = document.querySelectorAll('.logo-fuego');
  if (!fuegoParts.length) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let smoothX = mouseX;
  let smoothY = mouseY;

  document.addEventListener(
    'mousemove',
    (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    },
    { passive: true }
  );

  function frame(timestamp) {
    const time = timestamp * 0.001;
    smoothX += (mouseX - smoothX) * 0.08;
    smoothY += (mouseY - smoothY) * 0.08;

    const driftX = 50 + Math.sin(time * 0.55) * 28 + Math.cos(time * 0.31) * 12;
    const driftY = 50 + Math.cos(time * 0.47) * 22 + Math.sin(time * 0.29) * 10;
    const driftAngle = 155 + Math.sin(time * 0.4) * 18;

    fuegoParts.forEach((part) => {
      const rect = part.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const localX = ((smoothX - rect.left) / rect.width) * 100;
      const localY = ((smoothY - rect.top) / rect.height) * 100;
      const cursorX = clamp(localX, 0, 100);
      const cursorY = clamp(localY, 0, 100);
      const isHero = Boolean(part.closest('.hero-logo'));
      const influence = isHero ? 0.58 : 0.4;

      const shineX = driftX * (1 - influence) + cursorX * influence;
      const shineY = driftY * (1 - influence) + cursorY * influence;
      const angle = driftAngle + (cursorX - 50) * (isHero ? 0.75 : 0.5);

      part.style.setProperty('--shine-x', `${shineX}%`);
      part.style.setProperty('--shine-y', `${shineY}%`);
      part.style.setProperty('--logo-angle', `${angle}deg`);
    });

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
