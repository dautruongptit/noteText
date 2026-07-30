import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Note } from "../types";
import { localBackup } from "../utils/localBackup";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export function useAutoSave(
  notes: Note[],
  setNotes: Dispatch<SetStateAction<Note[]>>,
  activeId: string,
  activeContent: string | undefined,
) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [saveError, setSaveError] = useState(false);
  const autoSaveTimer = useRef<number | null>(null);
  const notesRef = useRef(notes);

  useEffect(() => { notesRef.current = notes; }, [notes]);

  const performSave = (noteId: string) => {
    setStatus("saving");
    setSaveError(false);
    setTimeout(() => {
      if (!navigator.onLine) {
        const note = notesRef.current.find((n) => n.id === noteId);
        if (note) localBackup(note);
        setSaveError(true);
        setStatus("error");
        return;
      }
      setNotes((items) => items.map((n) => n.id === noteId ? { ...n, updated: new Date() } : n));
      setSaveError(false);
      setStatus("saved");
    }, 320);
  };

  const manualSave = () => {
    if (autoSaveTimer.current !== null) {
      window.clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    if (status === "saved") return;
    performSave(activeId);
  };

  // Autosave debounce — stores timer ref so manualSave can cancel it
  useEffect(() => {
    if (status !== "unsaved") return;
    autoSaveTimer.current = window.setTimeout(() => {
      autoSaveTimer.current = null;
      performSave(activeId);
    }, 1300);
    return () => {
      if (autoSaveTimer.current !== null) {
        window.clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContent, activeId, status]);

  // Ctrl/Cmd+S — cancels pending auto-save timer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        manualSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const markUnsaved = () => { setStatus("unsaved"); setSaveError(false); };
  const markSaved = () => setStatus("saved");

  const statusLabel = () => {
    if (status === "saving") return "Đang lưu...";
    if (status === "error") return "Lưu thất bại — đã lưu tạm";
    if (status === "saved") return "Đã lưu";
    return "Chưa lưu";
  };

  return { status, saveError, manualSave, markUnsaved, markSaved, statusLabel };
}
