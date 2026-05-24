import { escapeHtml } from './product-utils.js';

const SCARE_IMAGE = '/assets/pope-jumpscare.png';
const SCARE_SOUND = '/assets/rome-scare.mp3';
const SCARE_DURATION_MS = 2800;
const ROME_PATTERN = /\bRome\b/;

let scareActive = false;
let scareAudio = null;

export function formatDescriptionHtml(description) {
  if (!description || !ROME_PATTERN.test(description)) {
    return escapeHtml(description);
  }

  return description
    .split(ROME_PATTERN)
    .map((part, index, parts) => {
      const chunk = escapeHtml(part);
      if (index === parts.length - 1) return chunk;
      return `${chunk}<button type="button" class="rome-trigger">Rome</button>`;
    })
    .join('');
}

export function bindRomeScare(container) {
  if (!container) return;

  preloadScareSound();

  container.querySelectorAll('.rome-trigger').forEach((trigger) => {
    if (trigger.dataset.bound) return;
    trigger.dataset.bound = '1';
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      playRomeScare(trigger);
    });
  });
}

function playRomeScare(originEl) {
  if (scareActive || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  scareActive = true;
  const stopSound = playScareSound();

  const rect = originEl.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.className = 'rome-scare-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const tv = document.createElement('div');
  tv.className = 'rome-scare-tv';
  tv.style.setProperty('--rome-x', `${rect.left + rect.width / 2}px`);
  tv.style.setProperty('--rome-y', `${rect.top + rect.height / 2}px`);

  const img = document.createElement('img');
  img.src = SCARE_IMAGE;
  img.alt = '';
  img.decoding = 'async';
  img.draggable = false;

  tv.appendChild(img);
  overlay.appendChild(tv);
  document.body.appendChild(overlay);

  const finish = () => {
    stopSound();
    overlay.remove();
    scareActive = false;
  };

  overlay.addEventListener('animationend', finish, { once: true });
  window.setTimeout(finish, SCARE_DURATION_MS + 400);
}

function preloadScareSound() {
  if (scareAudio) return;

  scareAudio = new Audio(SCARE_SOUND);
  scareAudio.preload = 'auto';
}

function playScareSound() {
  const audio = scareAudio ? scareAudio.cloneNode() : new Audio(SCARE_SOUND);
  audio.volume = 1;
  audio.play().catch(() => {});

  const fadeStartMs = SCARE_DURATION_MS * 0.68;
  const fadeDurationMs = SCARE_DURATION_MS - fadeStartMs;
  let fadeTimer = null;
  let fadeInterval = null;

  fadeTimer = window.setTimeout(() => {
    const steps = 28;
    const stepMs = fadeDurationMs / steps;
    let step = 0;
    const startVolume = audio.volume;

    fadeInterval = window.setInterval(() => {
      step += 1;
      audio.volume = Math.max(0, startVolume * (1 - step / steps));

      if (step >= steps) {
        window.clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
      }
    }, stepMs);
  }, fadeStartMs);

  return () => {
    window.clearTimeout(fadeTimer);
    window.clearInterval(fadeInterval);
    audio.pause();
    audio.currentTime = 0;
  };
}
