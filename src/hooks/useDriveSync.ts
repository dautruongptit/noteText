import { useCallback, useEffect, useRef, useState } from "react";
import type { Note, NoteSyncStatus } from "../types";
import type { SaveStatus } from "./useAutoSave";

export function useDriveSync(notes: Note[], status: SaveStatus, activeId: string) {
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [showDrivePanel, setShowDrivePanel] = useState(false);
  const [noteSyncMap, setNoteSyncMap] = useState<Record<string, NoteSyncStatus>>({});
  const notesRef = useRef(notes);
  const driveConnectedRef = useRef(driveConnected);

  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { driveConnectedRef.current = driveConnected; }, [driveConnected]);

  const doSync = useCallback(() => {
    setSyncStatus("syncing");
    setNoteSyncMap((prev) => {
      const next: Record<string, NoteSyncStatus> = {};
      notesRef.current.forEach((n) => { next[n.id] = "syncing"; });
      Object.keys(prev).forEach((k) => { if (!next[k]) next[k] = "syncing"; });
      return next;
    });
    setTimeout(() => {
      setSyncStatus("synced");
      setLastSynced(new Date());
      setNoteSyncMap((prev) => {
        const next = { ...prev };
        notesRef.current.forEach((n) => { next[n.id] = "synced"; });
        return next;
      });
    }, 1800);
  }, []);

  // Auto-sync after save
  useEffect(() => {
    if (status !== "saved" || !driveConnectedRef.current) return;
    const t = setTimeout(() => {
      setNoteSyncMap((prev) => ({ ...prev, [activeId]: "pending" }));
      doSync();
    }, 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const connectDrive = () => {
    setDriveConnecting(true);
    setTimeout(() => {
      setDriveConnecting(false);
      setDriveConnected(true);
      driveConnectedRef.current = true;
      const map: Record<string, NoteSyncStatus> = {};
      notesRef.current.forEach((n) => { map[n.id] = "pending"; });
      setNoteSyncMap(map);
      doSync();
    }, 2000);
  };

  const cancelConnecting = () => {
    setDriveConnecting(false);
    setShowDrivePanel(false);
  };

  const disconnectDrive = () => {
    setDriveConnected(false);
    driveConnectedRef.current = false;
    setSyncStatus("idle");
    setLastSynced(null);
    setNoteSyncMap({});
    setShowDrivePanel(false);
  };

  const driveIcon = () => {
    if (!driveConnected) return "☁";
    if (syncStatus === "syncing") return "↻";
    if (syncStatus === "error") return "⚠";
    if (syncStatus === "synced") return "✓";
    return "☁";
  };

  return {
    driveConnected, driveConnecting, syncStatus, lastSynced, showDrivePanel, setShowDrivePanel,
    noteSyncMap, doSync, connectDrive, cancelConnecting, disconnectDrive, driveIcon,
  };
}
