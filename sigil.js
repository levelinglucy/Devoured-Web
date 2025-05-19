// sigil.js — Living Sigil System

export function getOrCreateSigil() {
  let sigil = localStorage.getItem("aletheSigil");
  if (!sigil) {
    sigil = generateSigil();
    localStorage.setItem("aletheSigil", sigil);
  }
  return sigil;
}

export function mutateSigil() {
  let sigil = getOrCreateSigil();
  const part = sigil.split("-");
  let code = part[0].split("");
  const shift = Math.floor(Math.random() * code.length);
  code[shift] = String.fromCharCode(((code[shift].charCodeAt(0) - 65 + 1) % 26) + 65);
  const mutated = code.join("") + "-" + part[1];
  localStorage.setItem("aletheSigil", mutated);
  storeMutationHistory(mutated);
  return mutated;
}

function storeMutationHistory(newForm) {
  let history = JSON.parse(localStorage.getItem("sigilHistory") || "[]");
  if (!history.includes(newForm)) history.push(newForm);
  localStorage.setItem("sigilHistory", JSON.stringify(history));
}

export function getSigilHistory() {
  return JSON.parse(localStorage.getItem("sigilHistory") || "[]");
}

export function addTrait(trait) {
  let traits = JSON.parse(localStorage.getItem("sigilTraits") || "[]");
  if (!traits.includes(trait)) traits.push(trait);
  localStorage.setItem("sigilTraits", JSON.stringify(traits));
}

export function getTraits() {
  return JSON.parse(localStorage.getItem("sigilTraits") || "[]");
}

export function hasTrait(trait) {
  const traits = getTraits();
  return traits.includes(trait);
}

function generateSigil() {
  const seed = Math.random().toString(36).substring(2, 8).toUpperCase();
  const shard = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `${seed}-${shard}`;
}
