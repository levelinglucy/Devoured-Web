// echoquest.js — Echoquest Engine

import { getSigilPath } from './sigilpath.js';
import { getFragments } from './fragments.js';
import { getSigilHistory } from './sigil.js';

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
    const echoed = localStorage.getItem("echoCount") || 0;
    const glitched = localStorage.getItem("glitchTrigger") === "true";
    quest.complete = parseInt(echoed) >= 5 && glitched;
  } else if (path.id === "lost") {
    quest.title = "Fade and Return";
    quest.task = "Visit fragments.html, then do not return for 24 hours.";
    const lastVisit = localStorage.getItem("lostVisit");
    const now = Date.now();
    if (!lastVisit) {
      localStorage.setItem("lostVisit", now.toString());
    } else {
      const elapsed = now - parseInt(lastVisit);
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
