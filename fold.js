// fold.js — Fold Shift Engine

import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function getFoldState() {
  const db = getFirestore();
  const echoSnap = await getDocs(collection(db, "echoes"));
  const anomalySnap = await getDocs(collection(db, "anomalies"));

  const echoCount = echoSnap.size;
  const anomalyCount = anomalySnap.size;

  // Firestore sigils are data, not Object property names. Inherited names such as
  // "__proto__" must count normally and must not mutate global prototypes.
  const traitMap = new Map();

  echoSnap.forEach(doc => {
    const data = doc.data();
    const sigil = data.sigil;
    if (!traitMap.has(sigil)) traitMap.set(sigil, 0);
    if (data.tone === "rebellion") traitMap.set(sigil, traitMap.get(sigil) + 1);
  });

  const glitchedUsers = new Set();
  anomalySnap.forEach(doc => {
    const d = doc.data();
    if (d.category?.includes("loop") || d.category?.includes("self")) {
      glitchedUsers.add(d.sigil);
    }
  });

  const rekindledBursts = Array.from(traitMap.values()).filter(count => count >= 3).length;

  if (glitchedUsers.size >= 3) return "Fractured";
  if (rekindledBursts >= 3) return "Ignited";
  if (echoCount >= 5 || anomalyCount >= 2) return "Awake";
  return "Still";
}
