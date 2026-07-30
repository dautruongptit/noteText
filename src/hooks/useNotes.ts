import { useRef, useState, type MouseEvent } from "react";
import type { Note, MenuPos } from "../types";
import { uniqueName } from "../utils/uniqueName";

const MENU_EST_H = 160;

const initialNotes: Note[] = [
  { id: "welcome", name: "welcome.txt", content: "# Ghi chú của tôi\n\nChào mừng bạn đến với Noted.\n\n• Ctrl + S để lưu nhanh\n• Mọi thay đổi được tự động lưu\n• Mở nhiều ghi chú trong các tab", updated: new Date(Date.now() - 1000 * 60 * 3) },
  { id: "ideas", name: "ý tưởng.txt", content: "Ý tưởng tuần này\n\n1. Hoàn thiện trang giới thiệu\n2. Gửi bản thiết kế\n3. Đặt lịch review", updated: new Date(Date.now() - 1000 * 60 * 42) },
  { id: "readme", name: "README.txt", content: "NOTED / personal workspace\n\nKhông gian yên tĩnh để viết và lưu giữ điều quan trọng.", updated: new Date(Date.now() - 1000 * 60 * 60 * 5) },
];

// markSaved: called after a fresh note is created (via newNote, or the
// empty-fallback inside closeTab/deleteNote) so the save-status hook
// resets to "saved" for the newly active, untouched note.
export function useNotes(markSaved: () => void) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [tabs, setTabs] = useState(["welcome", "ideas"]);
  const [activeId, setActiveId] = useState("welcome");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<MenuPos>({ top: 0, right: 0 });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const active = notes.find((n) => n.id === activeId) ?? notes[0];
  const lines = active?.content.split("\n") ?? [""];

  const openNote = (id: string, selectMode: boolean) => {
    if (selectMode) return;
    if (!tabs.includes(id)) setTabs((t) => [...t, id]);
    setActiveId(id);
    setMenuId(null);
  };

  const newNote = () => {
    const name = uniqueName(notes, "New Note.txt");
    const note: Note = { id: crypto.randomUUID(), name, content: "", updated: new Date() };
    setNotes((n) => [...n, note]);
    setTabs((t) => [...t, note.id]);
    setActiveId(note.id);
    markSaved();
    setTimeout(() => textarea.current?.focus(), 0);
  };

  const closeTab = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const next = tabs.filter((t) => t !== id);
    setTabs(next);
    if (id === activeId && next.length) setActiveId(next[next.length - 1]);
    if (!next.length) newNote();
  };

  const duplicate = (id: string) => {
    const src = notes.find((n) => n.id === id)!;
    const dot = src.name.lastIndexOf(".");
    const base = dot > 0 ? `${src.name.slice(0, dot)} (copy)${src.name.slice(dot)}` : `${src.name} (copy)`;
    const name = uniqueName(notes, base);
    const copy: Note = { ...src, id: crypto.randomUUID(), name, updated: new Date() };
    setNotes((n) => [...n, copy]);
    setTabs((t) => [...t, copy.id]);
    setActiveId(copy.id);
    setMenuId(null);
  };

  const download = (id: string) => {
    const note = notes.find((n) => n.id === id)!;
    const url = URL.createObjectURL(new Blob([note.content], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url; a.download = note.name; a.click();
    URL.revokeObjectURL(url);
    setMenuId(null);
  };

  const deleteNote = () => {
    if (!deleteId) return;
    const remaining = notes.filter((n) => n.id !== deleteId);
    setNotes(remaining);
    const newTabs = tabs.filter((id) => id !== deleteId);
    setTabs(newTabs);
    if (activeId === deleteId) setActiveId(newTabs[0] ?? remaining[0]?.id ?? "");
    setDeleteId(null);
    if (!newTabs.length && !remaining.length) newNote();
  };

  // Smart dropdown positioning
  const handleMoreClick = (e: MouseEvent<HTMLButtonElement>, noteId: string) => {
    e.stopPropagation();
    if (menuId === noteId) { setMenuId(null); return; }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < MENU_EST_H) {
      setMenuPos({ bottom: window.innerHeight - rect.top + 2, right: window.innerWidth - rect.right });
    } else {
      setMenuPos({ top: rect.bottom + 2, right: window.innerWidth - rect.right });
    }
    setMenuId(noteId);
  };

  return {
    notes, setNotes, tabs, setTabs, activeId, setActiveId, active, lines,
    menuId, setMenuId, menuPos, deleteId, setDeleteId, textarea,
    openNote, newNote, closeTab, duplicate, download, deleteNote, handleMoreClick,
  };
}
