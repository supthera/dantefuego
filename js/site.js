export function initFonts() {
  return Promise.race([
    document.fonts.load('1em BertholdFraktur'),
    new Promise((resolve) => setTimeout(resolve, 2500))
  ]).finally(() => {
    document.documentElement.classList.remove('fonts-pending');
  });
}
