import type { MouseEvent } from "react";
import type { Note } from "../../types";
import type { SaveStatus } from "../../hooks/useAutoSave";

type Props = {
  dark: boolean;
  onToggleSidebar: () => void;
  tabs: string[];
  notes: Note[];
  activeId: string;
  status: SaveStatus;
  onSelectTab: (id: string) => void;
  onCloseTab: (e: MouseEvent, id: string) => void;
  onNewNote: () => void;
  onManualSave: () => void;
  onToggleDark: () => void;
};

export function TopBar({
  dark, onToggleSidebar, tabs, notes, activeId, status,
  onSelectTab, onCloseTab, onNewNote, onManualSave, onToggleDark,
}: Props) {
  return (
    <header className="topbar">
      <button className="brand" onClick={(e) => { e.stopPropagation(); onToggleSidebar(); }}>
        <span className="brand-mark">N</span><span>noted</span>
      </button>
      <div className="tabs">
        {tabs.map((id) => {
          const note = notes.find((n) => n.id === id);
          if (!note) return null;
          return (
            <button key={id} onClick={() => onSelectTab(id)} className={`tab ${activeId === id ? "active" : ""}`}>
              <span className="file-glyph">▤</span>
              <span className="tab-name">{note.name}</span>
              {(status === "unsaved" || status === "error") && activeId === id && <i className="unsaved" />}
              <span className="close" onClick={(e) => onCloseTab(e, id)}>×</span>
            </button>
          );
        })}
        <button className="new-tab" onClick={onNewNote}>+</button>
      </div>
      <div className="top-actions">
        <button className="save-btn" onClick={onManualSave} title="Lưu (⌘S)">⌘</button>
        <button className="mode" onClick={onToggleDark}>{dark ? "☀" : "◐"}</button>
      </div>
    </header>
  );
}
