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

export function getGodState() {
  const state = JSON.parse(localStorage.getItem(key)) || defaultState;
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
