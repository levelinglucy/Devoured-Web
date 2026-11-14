// echoquest.js — Echoquest Engine

import { getSigilPath } from './sigilpath.js';
import { getFragments } from './fragments.js';
import { getSigilHistory } from './sigil.js';

// Progress is stored as decimal text. Prefix parsing (e.g. "5junk") can
// falsely complete a quest; malformed records must remain untouched.
function readSavedProgress(raw, key) {
  if (typeof raw !== "string" || !/^(0|[1-9][0-9]*)$/.test(raw)) {
    throw new Error("Saved " + key + " progress is invalid; preserve the original record.");
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) {
    throw new Error("Saved " + key + " progress is outside the safe integer range.");
  }
  return value;
}

export function getEchoquest() {
  const path = getSigilPath();
  const fragments = getFragments();
  const mutations = getSigilHistory().length;

  const quest = {
    id: path.id,
    title: "Unwritten",
    task: "There is no quest here. Yet.",
    complete: false
  };

  if (path.id === "witness") {
    quest.title = "The Archivist’s Vigil";
    quest.task = "Collect at least 3 fragments and visit force.html.";
    quest.complete = fragments.length >= 3;
  } else if (path.id === "fire") {
    quest.title = "The Ember’s Call";
    quest.task = "Leave 5 echoes and trigger a glitch (redirected to glitch.html).";
    const rawEchoed = localStorage.getItem("echoCount");
    const echoed = rawEchoed === null ? 0 : readSavedProgress(rawEchoed, "echoCount");
    const glitched = localStorage.getItem("glitchTrigger") === "true";
    quest.complete = echoed >= 5 && glitched;
  } else if (path.id === "lost") {
    quest.title = "Fade and Return";
    quest.task = "Visit fragments.html, then do not return for 24 hours.";
    const lastVisit = localStorage.getItem("lostVisit");
    const now = Date.now();
    if (lastVisit === null) {
      localStorage.setItem("lostVisit", now.toString());
    } else {
      const elapsed = now - readSavedProgress(lastVisit, "lostVisit");
      quest.complete = elapsed >= 86400000; // 24h
    }
  } else if (path.id === "split") {
    quest.title = "The Mirror Knows";
    quest.task = "Echo a looped phrase and return to mirror.html.";
    const mirrored = localStorage.getItem("mirrorLoop") === "true";
    quest.complete = mirrored;
  }

  return quest;
}
