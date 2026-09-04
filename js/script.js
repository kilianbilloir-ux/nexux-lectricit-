// NEXUS ÉLECTRICITÉ — script.js

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Menu mobile ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Formulaire de rendez-vous ---------- */
  const form = document.querySelector('.rdv-form');
  if (form) {
    const successBox = document.querySelector('.form-success');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      form.querySelectorAll('[required]').forEach((field) => {
        const wrapper = field.closest('.field');
        const filled = field.type === 'checkbox' ? field.checked : field.value.trim() !== '';

        if (!filled) {
          valid = false;
          wrapper.classList.add('invalid');
        } else {
          wrapper.classList.remove('invalid');
        }
      });

      const emailField = form.querySelector('#email');
      if (emailField && emailField.value.trim() !== '') {
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim());
        if (!emailOk) {
          valid = false;
          emailField.closest('.field').classList.add('invalid');
        }
      }

      if (valid) {
        // Étape suivante : brancher l'envoi réel (e-mail / backend).
        // Pour l'instant on confirme simplement la saisie côté client.
        form.reset();
        if (successBox) successBox.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  /* ---------- Année dans le pied de page ---------- */
  const yearEl = document.querySelector('#current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
