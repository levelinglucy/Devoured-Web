// fold.js — Fold Shift Engine

import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function getFoldState() {
  const db = getFirestore();
  const echoSnap = await getDocs(collection(db, "echoes"));
  const anomalySnap = await getDocs(collection(db, "anomalies"));

  const echoCount = echoSnap.size;
  const anomalyCount = anomalySnap.size;

  const traitMap = {};

  echoSnap.forEach(doc => {
    const data = doc.data();
    if (!traitMap[data.sigil]) traitMap[data.sigil] = { rekindled: 0 };
    if (data.tone === "rebellion") traitMap[data.sigil].rekindled++;
  });

  const glitchedUsers = new Set();
  anomalySnap.forEach(doc => {
    const d = doc.data();
    if (d.category?.includes("loop") || d.category?.includes("self")) {
      glitchedUsers.add(d.sigil);
    }
  });

  const rekindledBursts = Object.values(traitMap).filter(v => v.rekindled >= 3).length;

  if (glitchedUsers.size >= 3) return "Fractured";
  if (rekindledBursts >= 3) return "Ignited";
  if (echoCount >= 5 || anomalyCount >= 2) return "Awake";
  return "Still";
}
