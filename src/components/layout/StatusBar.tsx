import type { SaveStatus } from "../../hooks/useAutoSave";

type Props = {
  status: SaveStatus;
  statusLabel: string;
  driveConnected: boolean;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  driveIconChar: string;
  onOpenDrivePanel: () => void;
  cursorLine: number;
  linesCount: number;
  charCount: number;
};

export function StatusBar({
  status, statusLabel, driveConnected, syncStatus, driveIconChar,
  onOpenDrivePanel, cursorLine, linesCount, charCount,
}: Props) {
  return (
    <footer className="statusbar">
      <div>
        <span className={`save-status ${status}`} />
        <span className={status === "error" ? "status-error-text" : ""}>{statusLabel}</span>
        <button
          className={`drive-status ${driveConnected ? (syncStatus === "syncing" ? "syncing" : syncStatus === "error" ? "error" : "connected") : ""}`}
          onClick={(e) => { e.stopPropagation(); onOpenDrivePanel(); }}
          title={driveConnected ? "Google Drive đã kết nối" : "Kết nối Google Drive"}
        >
          <span className={syncStatus === "syncing" && driveConnected ? "spin" : ""}>{driveIconChar}</span>
        </button>
      </div>
      <div>
        <span>Ln {cursorLine}</span>
        <span>Lines {linesCount}</span>
        <span>{charCount} ký tự</span>
        <span>UTF-8</span>
        <span>Plain Text</span>
      </div>
    </footer>
  );
}
