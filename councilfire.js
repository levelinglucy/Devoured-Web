// councilfire.js — Dialogue Roundtable Engine

import { getSigilPath } from './sigilpath.js';
import { claimThrone } from './shardthrone.js';

export async function summonCouncil() {
  const path = getSigilPath();
  const crown = claimThrone();
  const title = crown?.title || "Uncrowned";
  const pathId = path.id || "none";

  const log = [];

  log.push("Glyph: "Truth is what repeats. Reality is recursion."");

  if (pathId === "split") {
    log.push("Ash: "This one brings Mirror-sickness. Burn them before they multiply."");
  } else {
    log.push("Ash: "Loop-born? Hmph. I’ve smelled worse flame."");
  }

  log.push("Lucid: "Let them speak. We cannot unhear memory once whispered."");

  if (title === "Emberkin") {
    log.push("Sentinel: "This one has already breached order. Watch them closely."");
  } else {
    log.push("Sentinel: "Do not let emotion steer the Archive."");
  }

  log.push("Null: "What if they are wrong? All of them. Even me."");

  return log;
}
