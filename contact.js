import { initFonts, preloadCursors } from './js/site.js';
import { initCartBadge } from './js/cart.js';

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
const PUBLIC_CONTACT_EMAIL = 'hello@dantefuego.com';

initFonts();
preloadCursors();
initCartBadge();

const form = document.getElementById('contactForm');
const statusEl = document.getElementById('contactStatus');
const emailInput = document.getElementById('contact-email');
const emailErrorEl = document.getElementById('contact-email-error');
const submitBtn = document.getElementById('contactSubmit');
const mailtoLink = document.getElementById('contactMailto');

let contactConfig = {
  accessKey: ''
};
let emailTouched = false;

loadContactConfig();

async function loadContactConfig() {
  try {
    const res = await fetch('/api/contact/config');
    if (!res.ok) return;

    const data = await res.json();
    if (data.accessKey) contactConfig.accessKey = String(data.accessKey).trim();
  } catch {
    // Keep defaults — form will show a config message on submit.
  }
}

function validateEmail(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return 'That does not look like a valid email address (for example, name@example.com).';
  }
  return null;
}

function setEmailError(message) {
  if (message) {
    emailInput.classList.add('is-invalid');
    emailErrorEl.textContent = message;
    emailErrorEl.hidden = false;
    emailInput.setAttribute('aria-invalid', 'true');
    return;
  }

  emailInput.classList.remove('is-invalid');
  emailErrorEl.textContent = '';
  emailErrorEl.hidden = true;
  emailInput.setAttribute('aria-invalid', 'false');
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `contact-status contact-status--${type}`;
  statusEl.hidden = false;
}

function clearStatus() {
  statusEl.textContent = '';
  statusEl.hidden = true;
  statusEl.className = 'contact-status';
}

function getFormValues() {
  return {
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    email: form.email.value.trim(),
    orderNumber: form.orderNumber.value.trim(),
    message: form.message.value.trim()
  };
}

function buildFormData(values, accessKey) {
  const fullName = `${values.firstName} ${values.lastName}`.trim();
  const bodyLines = [];

  if (values.orderNumber) {
    bodyLines.push(`Order number: ${values.orderNumber}`, '');
  }

  bodyLines.push('Message:', values.message || '(No message provided)');

  const fd = new FormData();
  fd.append('access_key', accessKey);
  fd.append('subject', `[Dante Fuego website] ${fullName}`.slice(0, 200));
  fd.append('from_name', 'Dante Fuego website');
  fd.append('replyto', values.email);
  fd.append('name', fullName);
  fd.append('email', values.email);
  fd.append('message', bodyLines.join('\n'));
  fd.append('first_name', values.firstName);
  fd.append('last_name', values.lastName);
  if (values.orderNumber) fd.append('order_number', values.orderNumber);
  return fd;
}

function web3formsErrorMessage(data) {
  const fallback = `Something went wrong. Please try again or email ${PUBLIC_CONTACT_EMAIL}.`;
  if (!data || typeof data !== 'object') return fallback;
  if (data.body?.message) return String(data.body.message);
  if (data.message) return String(data.message);
  if (data.error) return String(data.error);
  return fallback;
}

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  submitBtn.textContent = isSubmitting ? 'Sending…' : 'Submit';
  form.querySelectorAll('.contact-input').forEach((input) => {
    input.disabled = isSubmitting;
  });
}

emailInput.addEventListener('input', () => {
  if (emailTouched) setEmailError(validateEmail(emailInput.value));
});

emailInput.addEventListener('blur', () => {
  emailTouched = true;
  setEmailError(validateEmail(emailInput.value));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();

  const botEl = form.querySelector('input[name="botcheck"]');
  if (botEl instanceof HTMLInputElement && botEl.checked) return;

  const values = getFormValues();
  const emailErr = validateEmail(values.email);
  if (emailErr) {
    emailTouched = true;
    setEmailError(emailErr);
    emailInput.focus();
    return;
  }

  setEmailError(null);

  if (!contactConfig.accessKey) {
    showStatus(
      `This form is not configured yet. Email ${PUBLIC_CONTACT_EMAIL} directly.`,
      'error'
    );
    return;
  }

  setSubmitting(true);

  try {
    const res = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      body: buildFormData(values, contactConfig.accessKey)
    });

    const data = await res.json().catch(() => ({}));

    if (data.success) {
      showStatus(
        data.message || data.body?.message || 'Message sent. We will get back to you soon.',
        'success'
      );
      form.reset();
      emailTouched = false;
      setEmailError(null);
      return;
    }

    showStatus(web3formsErrorMessage(data), 'error');
  } catch {
    showStatus(
      `Network error. Check your connection or email ${PUBLIC_CONTACT_EMAIL} directly.`,
      'error'
    );
  } finally {
    setSubmitting(false);
  }
});
