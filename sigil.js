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
  // Validate saved history before changing even the current sigil.
  const history = readStringList("sigilHistory");
  let sigil = getOrCreateSigil();
  const part = sigil.split("-");
  let code = part[0].split("");
  const shift = Math.floor(Math.random() * code.length);
  code[shift] = String.fromCharCode(((code[shift].charCodeAt(0) - 65 + 1) % 26) + 65);
  const mutated = code.join("") + "-" + part[1];
  localStorage.setItem("aletheSigil", mutated);
  storeMutationHistory(mutated, history);
  return mutated;
}

function readStringList(name) {
  const saved = localStorage.getItem(name);
  if (saved === null) return [];

  let entries;
  try {
    entries = JSON.parse(saved);
  } catch {
    throw new Error("Saved " + name + " is unreadable");
  }
  if (!Array.isArray(entries) || entries.some(value => typeof value !== "string")) {
    throw new Error("Saved " + name + " must be a list of text entries");
  }
  return entries;
}

function storeMutationHistory(newForm, history) {
  if (!history.includes(newForm)) history.push(newForm);
  localStorage.setItem("sigilHistory", JSON.stringify(history));
}

export function getSigilHistory() {
  return readStringList("sigilHistory");
}

export function addTrait(trait) {
  if (typeof trait !== "string") throw new TypeError("Sigil trait must be text");
  let traits = readStringList("sigilTraits");
  if (!traits.includes(trait)) traits.push(trait);
  localStorage.setItem("sigilTraits", JSON.stringify(traits));
}

export function getTraits() {
  return readStringList("sigilTraits");
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
