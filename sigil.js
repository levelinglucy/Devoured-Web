// sigil.js — Living Sigil System

export function getOrCreateSigil() {
  const saved = localStorage.getItem("aletheSigil");
  if (saved !== null) {
    // Absence permits creation; a present but damaged identity does not.
    // Accept historical variable-length uppercase base36 seeds and numeric shards.
    if (!/^[A-Z0-9]+-[0-9]+$/.test(saved)) {
      throw new Error("Saved sigil is invalid; existing identity was not cleared");
    }
    return saved;
  }
  const sigil = generateSigil();
  localStorage.setItem("aletheSigil", sigil);
  return sigil;
}

export function mutateSigil() {
  // Validate saved history before changing even the current sigil.
  const history = readStringList("sigilHistory");
  const previousHistory = localStorage.getItem("sigilHistory");
  let sigil = getOrCreateSigil();
  const part = sigil.split("-");
  let code = part[0].split("");
  const shift = Math.floor(Math.random() * code.length);
  // The generated seed is base36: digits must not roll into punctuation.
  code[shift] = /[0-9]/.test(code[shift])
    ? String((Number(code[shift]) + 1) % 10)
    : String.fromCharCode(((code[shift].charCodeAt(0) - 65 + 1) % 26) + 65);
  const mutated = code.join("") + "-" + part[1];
  storeMutationHistory(mutated, history, previousHistory);
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

function storeMutationHistory(newForm, history, previousHistory) {
  if (!history.includes(newForm)) history.push(newForm);
  // Persist the history first: if this larger write hits a storage limit,
  // the current identity must not advance without its history entry.
  localStorage.setItem("sigilHistory", JSON.stringify(history));
  try {
    localStorage.setItem("aletheSigil", newForm);
  } catch (writeError) {
    // localStorage has no multi-key transaction. On a rejected second write,
    // restore the exact previous bytes (including the absent-key case).
    try {
      if (previousHistory === null) localStorage.removeItem("sigilHistory");
      else localStorage.setItem("sigilHistory", previousHistory);
    } catch (rollbackError) {
      throw new AggregateError(
        [writeError, rollbackError],
        "Sigil write and history rollback failed; saved records may be inconsistent. Preserve them for manual recovery."
      );
    }
    throw writeError;
  }
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
  const seed = Math.random().toString(36).substring(2, 8).padEnd(6, "0").toUpperCase();
  const shard = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `${seed}-${shard}`;
}
