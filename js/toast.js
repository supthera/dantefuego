const TOAST_DURATION_MS = 3000;

let toastRoot;

function ensureToastRoot() {
  if (toastRoot) return toastRoot;

  toastRoot = document.createElement('div');
  toastRoot.className = 'site-toast-root';
  toastRoot.setAttribute('aria-live', 'polite');
  toastRoot.setAttribute('aria-relevant', 'additions');
  document.body.appendChild(toastRoot);
  return toastRoot;
}

export function showToast(message, { icon = '✨' } = {}) {
  const root = ensureToastRoot();
  const toast = document.createElement('div');
  toast.className = 'site-toast site-toast-dark';
  toast.setAttribute('role', 'status');

  const iconEl = document.createElement('span');
  iconEl.className = 'site-toast-icon';
  iconEl.textContent = icon;
  iconEl.setAttribute('aria-hidden', 'true');

  const messageEl = document.createElement('span');
  messageEl.className = 'site-toast-message';
  messageEl.textContent = message;

  toast.append(iconEl, messageEl);
  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.classList.add('is-leaving');
    window.setTimeout(() => toast.remove(), 220);
  }, TOAST_DURATION_MS);
}

export function initComingSoonLinks() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-coming-soon]');
    if (!link) return;

    event.preventDefault();
    showToast(`${link.dataset.comingSoon} Coming Soon!`, {
      icon: link.dataset.comingSoonIcon || '✨'
    });
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComingSoonLinks);
  } else {
    initComingSoonLinks();
  }
}
