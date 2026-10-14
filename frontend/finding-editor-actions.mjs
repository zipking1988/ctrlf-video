// Keep explicit finding actions independent of collection filters and navigation.
export function openFinding(id, setEditingId, setFilter) {
  setFilter("all");
  setEditingId(id);
}

export async function saveFinding(persistence, setMessage) {
  const context = persistence?.captureContext();
  if (!context) {
    setMessage("Not saved. The investigation service is unavailable; keep this page open and check the save indicator.");
    return;
  }
  try {
    const saved = await persistence.flush();
    if (!persistence.isCurrent(context)) return;
    setMessage(saved === true
      ? "Finding saved locally."
      : "Not saved. Check the save indicator for a conflict or unavailable service before leaving this page.");
  } catch {
    if (!persistence.isCurrent(context)) return;
    setMessage("Save failed. Your edits remain here; check the save indicator to retry or recover a conflict.");
  }
}
