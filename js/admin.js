// NEXUS ÉLECTRICITÉ — admin.js
// Connexion (Firebase Auth) + planning en temps réel (Firestore).
// Seul un compte que tu crées toi-même dans Firebase peut se connecter.

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const MOIS = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const STATUTS = [
  { value: 'a-confirmer', label: 'À confirmer', className: 'status-a-confirmer' },
  { value: 'confirme', label: 'Confirmé', className: 'status-confirme' },
  { value: 'termine', label: 'Terminé', className: 'status-termine' },
];

function statusInfo(value) {
  return STATUTS.find((s) => s.value === value) || STATUTS[0];
}
function nextStatus(current) {
  const idx = STATUTS.findIndex((s) => s.value === current);
  return STATUTS[(idx + 1) % STATUTS.length].value;
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

let unsubscribe = null;

function renderAgenda(items) {
  const container = document.getElementById('agenda-list');
  const count = document.getElementById('admin-count');
  count.textContent = items.length + ' rendez-vous';

  if (items.length === 0) {
    container.innerHTML = '<div class="agenda-empty">Aucun rendez-vous pour l\'instant.</div>';
    return;
  }

  container.innerHTML = '';
  items.forEach((appt) => {
    const d = appt.date ? new Date(appt.date + 'T00:00:00') : null;
    const day = d && !isNaN(d) ? d.getDate() : '--';
    const month = d && !isNaN(d) ? MOIS[d.getMonth()] : '';
    const status = statusInfo(appt.statut);
    const nomComplet = [appt.prenom, appt.nom].filter(Boolean).join(' ') || appt.nom;

    const item = document.createElement('div');
    item.className = 'agenda-item';
    item.innerHTML = `
      <div class="agenda-date"><span class="day">${day}</span><span class="month">${month}</span></div>
      <div class="agenda-main">
        <h3>${escapeHtml(nomComplet)} — ${escapeHtml(appt.intervention || '')}${appt.source === 'site' ? ' <span style="color:var(--gray-light); font-weight:400;">(via le site)</span>' : ''}</h3>
        <p class="agenda-meta">${escapeHtml(appt.creneau || '')}${appt.telephone || appt.tel ? ' · ' + escapeHtml(appt.telephone || appt.tel) : ''}${appt.adresse ? ' · ' + escapeHtml(appt.adresse) : ''}${appt.email ? ' · ' + escapeHtml(appt.email) : ''}</p>
        ${appt.description || appt.notes ? `<p class="agenda-notes">${escapeHtml(appt.description || appt.notes)}</p>` : ''}
      </div>
      <div class="agenda-actions">
        <button class="status-badge ${status.className}" data-action="status" data-id="${appt.id}" data-current="${appt.statut}">${status.label}</button>
        <button class="agenda-delete" data-action="delete" data-id="${appt.id}">Supprimer</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function startListening() {
  const q = query(collection(db, 'rendezvous'), orderBy('date', 'asc'));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderAgenda(items);
  }, (err) => {
    console.error(err);
    document.getElementById('agenda-list').innerHTML =
      '<div class="agenda-empty">Impossible de charger le planning. Vérifie ta connexion et les règles Firestore.</div>';
  });
}

document.getElementById('agenda-list')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  if (btn.dataset.action === 'status') {
    await updateDoc(doc(db, 'rendezvous', btn.dataset.id), { statut: nextStatus(btn.dataset.current) });
  } else if (btn.dataset.action === 'delete') {
    if (confirm('Supprimer ce rendez-vous du planning ?')) {
      await deleteDoc(doc(db, 'rendezvous', btn.dataset.id));
    }
  }
});

document.getElementById('admin-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await addDoc(collection(db, 'rendezvous'), {
    nom: document.getElementById('a-nom').value.trim(),
    telephone: document.getElementById('a-tel').value.trim(),
    intervention: document.getElementById('a-intervention').value,
    date: document.getElementById('a-date').value,
    creneau: document.getElementById('a-creneau').value,
    adresse: document.getElementById('a-adresse').value.trim(),
    description: document.getElementById('a-notes').value.trim(),
    statut: 'a-confirmer',
    source: 'manuel',
  });
  e.target.reset();
});

/* ---------- Connexion ---------- */

const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById('login-email').value.trim(),
      document.getElementById('login-password').value
    );
  } catch (err) {
    loginError.textContent = 'E-mail ou mot de passe incorrect.';
    loginError.style.display = 'block';
  }
});

document.getElementById('logout-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  const loginScreen = document.getElementById('login-screen');
  const planningScreen = document.getElementById('planning-screen');
  const logoutLink = document.getElementById('logout-link');

  if (user) {
    loginScreen.style.display = 'none';
    planningScreen.style.display = 'block';
    logoutLink.style.display = 'inline';
    if (!unsubscribe) startListening();
  } else {
    loginScreen.style.display = 'block';
    planningScreen.style.display = 'none';
    logoutLink.style.display = 'none';
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  }
});
