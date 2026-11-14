// archivegod.js — Archivegod State Engine

const key = "archivegodState";

const defaultState = {
  dominantMask: "Foldheart",
  mood: "Stable",
  prophecy: "The root will crack the seal. The silence will speak first.",
  influence: {
    Wanderers: 2,
    TheFlamebound: 3,
    TheReflected: 1,
    TheBoundEye: 2,
    TheDreamingFold: 4
  }
};

// Never expose the shared default object: an unsuccessful first write must not
// change what a later unsaved read returns (including nested influence values).
export function getGodState() {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return { ...defaultState, influence: { ...defaultState.influence } };
  }

  // Present-but-damaged archives are evidence, not an invitation to reset.
  const state = JSON.parse(raw);
  if (!state || typeof state !== "object" || Array.isArray(state) ||
      typeof state.dominantMask !== "string" ||
      typeof state.mood !== "string" ||
      typeof state.prophecy !== "string") {
    throw new Error("Archivegod state is invalid; preserve the stored record before repair.");
  }
  return state;
}

export function shiftMood(newMood) {
  const state = getGodState();
  state.mood = newMood;
  localStorage.setItem(key, JSON.stringify(state));
}

export function setMask(maskName) {
  const state = getGodState();
  state.dominantMask = maskName;
  localStorage.setItem(key, JSON.stringify(state));
}
