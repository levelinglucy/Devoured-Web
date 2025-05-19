// worldskin.js — Applies dynamic visual and behavioral themes

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFoldState } from './fold.js';

const firebaseConfig = {
  apiKey: "AIzaSyDne_qHXBalDkMYqq6Gp9Bis6HR-VHusuA",
  authDomain: "devoured-l-web.firebaseapp.com",
  projectId: "devoured-l-web",
  storageBucket: "devoured-l-web.firebasestorage.app",
  messagingSenderId: "320240692450",
  appId: "1:320240692450:web:3d6fcc78e364ef141e82bb"
};

initializeApp(firebaseConfig);

export async function applyWorldskin() {
  const state = await getFoldState();
  document.body.dataset.fold = state;
  document.body.classList.add(state.toLowerCase());
}
