// Render database echoes as inert text; never interpret stored fields as HTML.
export function renderShardEchoes(grid, snapshot, shard, doc = document) {
  grid.replaceChildren();
  const wanted = shard.toLowerCase();
  let matches = 0;

  snapshot.forEach((entry) => {
    const record = entry.data();
    const message = typeof record?.message === "string" ? record.message : "";
    if (!message.toLowerCase().includes(wanted)) return;

    matches += 1;
    const orb = doc.createElement("div");
    orb.className = "orb";
    for (const [className, value] of [
      ["sigil", record.sigil || record.shard || ""],
      ["timestamp", record.time ?? ""],
      ["message", message],
    ]) {
      const line = doc.createElement("div");
      line.className = className;
      line.textContent = String(value);
      orb.appendChild(line);
    }
    grid.appendChild(orb);
  });

  // A successful query with no matching records is not a loading error.
  if (matches === 0) {
    grid.textContent = `No ${shard[0].toUpperCase()}${shard.slice(1)} echoes found yet.`;
  }
}
