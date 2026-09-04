// NEXUS ÉLECTRICITÉ — rendez-vous.js
// Validation du formulaire + enregistrement de la demande dans Firestore.

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.rdv-form');
  if (!form) return;

  const successBox = document.querySelector('.form-success');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach((field) => {
      const wrapper = field.closest('.field');
      const filled = field.type === 'checkbox' ? field.checked : field.value.trim() !== '';
      wrapper.classList.toggle('invalid', !filled);
      if (!filled) valid = false;
    });

    const emailField = form.querySelector('#email');
    if (emailField && emailField.value.trim() !== '') {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim());
      if (!emailOk) {
        valid = false;
        emailField.closest('.field').classList.add('invalid');
      }
    }

    if (!valid) {
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const data = {
      nom: form.querySelector('#nom').value.trim(),
      prenom: form.querySelector('#prenom').value.trim(),
      telephone: form.querySelector('#telephone').value.trim(),
      email: form.querySelector('#email').value.trim(),
      intervention: form.querySelector('#intervention').value,
      adresse: form.querySelector('#adresse').value.trim(),
      date: form.querySelector('#date').value,
      creneau: form.querySelector('#creneau').value,
      description: form.querySelector('#description').value.trim(),
      statut: 'a-confirmer',
      source: 'site',
      createdAt: serverTimestamp(),
    };

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours…';
      await addDoc(collection(db, 'rendezvous'), data);

      form.reset();
      if (successBox) successBox.style.display = 'block';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'envoi. Merci de réessayer, ou de nous contacter directement.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer la demande';
    }
  });
});
