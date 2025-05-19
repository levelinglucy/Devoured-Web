// pagespawn.js — Ritual Page Generation System

const trailKey = "aletheSpawnTrail";

export function registerSpawn(title, filename, content) {
  const entry = {
    title: title,
    filename: filename,
    content: content,
    created: new Date().toISOString()
  };
  const trail = JSON.parse(localStorage.getItem(trailKey) || "[]");
  trail.push(entry);
  localStorage.setItem(trailKey, JSON.stringify(trail));
  // Save content as Blob-compatible string (for download/local use only)
  return entry;
}

export function getTrail() {
  return JSON.parse(localStorage.getItem(trailKey) || "[]");
}
