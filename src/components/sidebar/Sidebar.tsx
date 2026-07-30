import type { MouseEvent } from "react";
import type { Note, NoteSyncStatus } from "../../types";
import { SelectModeHeader } from "./SelectModeHeader";
import { NoteList } from "./NoteList";

type Props = {
  visible: boolean;
  width: number;
  notes: Note[];
  activeId: string;
  selectMode: boolean;
  selected: Set<string>;
  driveConnected: boolean;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  lastSynced: Date | null;
  noteSyncMap: Record<string, NoteSyncStatus>;
  onOpenNote: (id: string) => void;
  onNewNote: () => void;
  onEnterSelectMode: () => void;
  onExitSelectMode: () => void;
  onToggleSelect: (id: string) => void;
  onBulkDeleteRequest: () => void;
  onTouchStart: (id: string) => void;
  onTouchEnd: () => void;
  onMoreClick: (e: MouseEvent<HTMLButtonElement>, id: string) => void;
};

export function Sidebar({
  visible, width, notes, activeId, selectMode, selected, driveConnected, syncStatus, lastSynced,
  noteSyncMap, onOpenNote, onNewNote, onEnterSelectMode, onExitSelectMode, onToggleSelect,
  onBulkDeleteRequest, onTouchStart, onTouchEnd, onMoreClick,
}: Props) {
  return (
    <aside className={`sidebar ${visible ? "" : "collapsed"}`} style={visible ? { width } : undefined}>
      {selectMode ? (
        <SelectModeHeader selectedCount={selected.size} onDelete={onBulkDeleteRequest} onCancel={onExitSelectMode} />
      ) : (
        <div className="side-head">
          <span>FILE CỦA BẠN</span>
          <div className="side-head-actions">
            <button className="select-mode-btn" onClick={onEnterSelectMode} title="Chọn nhiều file">☑</button>
            <button onClick={onNewNote}>+</button>
          </div>
        </div>
      )}

      <NoteList
        notes={notes}
        activeId={activeId}
        selectMode={selectMode}
        selected={selected}
        driveConnected={driveConnected}
        noteSyncMap={noteSyncMap}
        onOpen={onOpenNote}
        onToggleSelect={onToggleSelect}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMoreClick={onMoreClick}
      />

      <div className="side-foot">
        <span className={`cloud-foot ${syncStatus === "syncing" && driveConnected ? "spin" : ""}`}>
          {driveConnected ? (syncStatus === "syncing" ? "↻" : syncStatus === "synced" ? "✓" : "☁") : "☁"}
        </span>
        <div>
          <b>{driveConnected ? "Google Drive" : "Đồng bộ hoá"}</b>
          <small>
            {!driveConnected && "Chưa kết nối"}
            {driveConnected && syncStatus === "syncing" && "Đang đồng bộ..."}
            {driveConnected && syncStatus === "synced" && lastSynced && `Lưu lúc ${lastSynced.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`}
            {driveConnected && syncStatus === "idle" && "Đã kết nối"}
          </small>
        </div>
      </div>
    </aside>
  );
}
