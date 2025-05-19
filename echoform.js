// echoform.js — Echoform Logic & Tracking

const key = "echoformVisits";

export function trackVisit(name) {
  const visits = JSON.parse(localStorage.getItem(key) || "{}");
  visits[name] = (visits[name] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(visits));
  return visits[name];
}
