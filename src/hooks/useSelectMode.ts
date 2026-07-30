import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Note } from "../types";

export function useSelectMode(
  notes: Note[],
  setNotes: Dispatch<SetStateAction<Note[]>>,
  tabs: string[],
  setTabs: Dispatch<SetStateAction<string[]>>,
  activeId: string,
  setActiveId: (id: string) => void,
  closeMenu: () => void,
  newNote: () => void,
) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [trash, setTrash] = useState<Note[]>([]);
  const longPressTimer = useRef<number | null>(null);

  const enterSelectMode = (firstId?: string) => {
    setSelectMode(true);
    setSelected(firstId ? new Set([firstId]) : new Set());
    closeMenu();
  };
  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const confirmBulkDelete = () => {
    const toDelete = [...selected];
    setTrash((prev) => [...prev, ...notes.filter((n) => toDelete.includes(n.id))]);
    const remaining = notes.filter((n) => !toDelete.includes(n.id));
    setNotes(remaining);
    const newTabs = tabs.filter((id) => !toDelete.includes(id));
    setTabs(newTabs);
    if (toDelete.includes(activeId)) setActiveId(newTabs[0] ?? remaining[0]?.id ?? "");
    exitSelectMode();
    setBulkDeleteConfirm(false);
    if (!remaining.length) newNote();
  };

  // Long-press for mobile select mode
  const handleTouchStart = (noteId: string) => {
    longPressTimer.current = window.setTimeout(() => enterSelectMode(noteId), 600);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current !== null) { window.clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  return {
    selectMode, selected, bulkDeleteConfirm, setBulkDeleteConfirm,
    enterSelectMode, exitSelectMode, toggleSelect, confirmBulkDelete,
    handleTouchStart, handleTouchEnd,
  };
}
