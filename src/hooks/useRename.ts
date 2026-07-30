import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Note } from "../types";
import { nameTaken } from "../utils/uniqueName";

export function useRename(
  notes: Note[],
  setNotes: Dispatch<SetStateAction<Note[]>>,
  closeMenu: () => void,
) {
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameError, setRenameError] = useState("");
  const renameInput = useRef<HTMLInputElement>(null);

  const openRename = (id: string) => {
    const note = notes.find((n) => n.id === id)!;
    setRenameId(id);
    setRenameName(note.name);
    setRenameError("");
    closeMenu();
    setTimeout(() => renameInput.current?.select(), 60);
  };

  const onRenameChange = (val: string) => {
    setRenameName(val);
    if (!val.trim()) { setRenameError("Tên file không được để trống"); return; }
    if (nameTaken(notes, val, renameId ?? undefined)) { setRenameError("Tên file đã tồn tại, vui lòng chọn tên khác"); return; }
    setRenameError("");
  };

  const commitRename = () => {
    if (!renameId || renameError || !renameName.trim()) return;
    setNotes((n) => n.map((x) => x.id === renameId ? { ...x, name: renameName.trim() } : x));
    setRenameId(null);
  };

  return { renameId, setRenameId, renameName, renameError, renameInput, openRename, onRenameChange, commitRename };
}
