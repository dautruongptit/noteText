import type { Note } from "../types";

export const localBackup = (note: Note) => {
  try {
    localStorage.setItem(`noted-bk-${note.id}`, JSON.stringify({ ...note, updated: note.updated.toISOString() }));
  } catch {}
};
