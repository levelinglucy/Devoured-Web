// fragments.js — Lore Fragment System

export function getFragments() {
  return JSON.parse(localStorage.getItem("aletheFragments") || "[]");
}

export function addFragment(title, text) {
  const existing = getFragments();
  if (!existing.find(f => f.title === title)) {
    existing.push({ title, text });
    localStorage.setItem("aletheFragments", JSON.stringify(existing));
  }
}

export function clearFragments() {
  localStorage.removeItem("aletheFragments");
}
