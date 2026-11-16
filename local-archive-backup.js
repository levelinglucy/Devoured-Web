// Opt-in, read-only recovery view for the two browser-local story archives.
// A displayed raw storage string is not parsed, normalized, uploaded or saved.
const archiveKeys = Object.freeze({
  fragments: "aletheFragments",
  trail: "aletheSpawnTrail"
});

export function revealRawArchive(kind, output, encoded, status, storage) {
  if (!Object.hasOwn(archiveKeys, kind)) {
    throw new TypeError("Unknown local story archive");
  }

  let raw;
  try {
    const source = storage === undefined ? globalThis.localStorage : storage;
    raw = source.getItem(archiveKeys[kind]);
  } catch {
    output.value = "";
    output.hidden = true;
    encoded.value = "";
    encoded.hidden = true;
    status.textContent = "This browser did not allow reading the saved archive. Nothing was changed.";
    return false;
  }

  if (raw === null) {
    output.value = "";
    output.hidden = true;
    encoded.value = "";
    encoded.hidden = true;
    status.textContent = "No saved local archive exists yet. Nothing was changed.";
    return false;
  }

  // Use a read-only textarea value, not HTML: arbitrary story text remains inert.
  // Even malformed JSON and present empty strings are available for manual copy.
  output.value = raw;
  output.hidden = false;
  // HTML textarea API values normalize CR and CRLF. A JSON-escaped copy
  // round-trips original line endings, control codes, and lone surrogates.
  encoded.value = JSON.stringify(raw);
  encoded.hidden = false;
  status.textContent = "Raw preview and lossless JSON-escaped backup shown. Copy the escaped version for exact text preservation; decode it as JSON before restoration. Nothing was uploaded or altered.";
  return true;
}
