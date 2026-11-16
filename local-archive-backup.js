// Opt-in, read-only recovery view for the two browser-local story archives.
// A displayed raw storage string is not parsed, normalized, uploaded or saved.
const archiveKeys = Object.freeze({
  fragments: "aletheFragments",
  trail: "aletheSpawnTrail"
});

export function revealRawArchive(kind, output, status, storage) {
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
    status.textContent = "This browser did not allow reading the saved archive. Nothing was changed.";
    return false;
  }

  if (raw === null) {
    output.value = "";
    output.hidden = true;
    status.textContent = "No saved local archive exists yet. Nothing was changed.";
    return false;
  }

  // Use a read-only textarea value, not HTML: arbitrary story text remains inert.
  // Even malformed JSON and present empty strings are available for manual copy.
  output.value = raw;
  output.hidden = false;
  status.textContent = "Raw saved text shown below. Select all and copy it into a private text file. This action does not upload or alter it.";
  return true;
}
