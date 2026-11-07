// Render database echoes as inert text; never interpret stored fields as HTML.
export function renderShardEchoes(grid, snapshot, shard, doc = document) {
  grid.replaceChildren();
  const wanted = shard.toLowerCase();

  snapshot.forEach((entry) => {
    const record = entry.data();
    const message = typeof record?.message === "string" ? record.message : "";
    if (!message.toLowerCase().includes(wanted)) return;

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
}
