import type { Note } from "../types";

const STORAGE_KEY = "noted-session";

type StoredNote = Omit<Note, "updated"> & { updated: string };
type StoredSession = { notes: StoredNote[]; tabs: string[]; activeId: string };
type RestoredSession = { notes: Note[]; tabs: string[]; activeId: string };

// Restores the exact working session (open notes + which tabs were open +
// which tab was active) so that closing the browser and coming back — or
// simply refreshing — lands the user back where they left off, instead of
// resetting to the hardcoded welcome/ideas notes every time.
export function loadSession(): RestoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredSession;
    if (!Array.isArray(parsed.notes) || parsed.notes.length === 0) return null;

    const notes: Note[] = parsed.notes.map((n) => ({ ...n, updated: new Date(n.updated) }));
    const noteIds = new Set(notes.map((n) => n.id));

    // Defensive: drop any tab id that no longer points to an existing note
    // (shouldn't normally happen since notes+tabs are saved together, but
    // guards against a corrupted/partially-written localStorage entry).
    const tabs = (parsed.tabs ?? []).filter((id) => noteIds.has(id));
    const activeId = noteIds.has(parsed.activeId) ? parsed.activeId : (tabs[0] ?? notes[0].id);

    return { notes, tabs: tabs.length ? tabs : [activeId], activeId };
  } catch {
    // Corrupted JSON / storage unavailable (e.g. private browsing quota) —
    // fall back to the app's hardcoded defaults, same fail-open behavior
    // already used by localBackup.ts.
    return null;
  }
}

export function saveSession(notes: Note[], tabs: string[], activeId: string): void {
  try {
    const payload: StoredSession = {
      notes: notes.map((n) => ({ ...n, updated: n.updated.toISOString() })),
      tabs,
      activeId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage full or unavailable — silently skip, this is a best-effort
    // convenience feature, never something that should break the editor.
  }
}
