// echoform.js — Browser-local Echoform Visit Tracking

const key = "echoformVisits";

// Missing history starts at zero; damaged existing history remains recoverable.
function readVisits() {
  const raw = localStorage.getItem(key);
  if (raw === null) return Object.create(null);

  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    throw new Error("Saved Echoform visit history is unreadable");
  }
  if (!saved || typeof saved !== "object" || Array.isArray(saved) ||
      Object.values(saved).some(value => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error("Saved Echoform visit history has invalid counts or shape");
  }

  // Own data keys such as "__proto__" must not inherit Object.prototype.
  return Object.assign(Object.create(null), saved);
}

export function trackVisit(name) {
  if (typeof name !== "string" || name.length === 0) {
    throw new Error("Echoform visit name must be non-empty text");
  }
  const visits = readVisits();
  const count = visits[name] ?? 0;
  if (count === Number.MAX_SAFE_INTEGER) {
    throw new Error("Echoform visit count cannot be incremented safely");
  }
  visits[name] = count + 1;
  localStorage.setItem(key, JSON.stringify(visits));
  return visits[name];
}
