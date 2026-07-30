export type Note = { id: string; name: string; content: string; updated: Date };
export type NoteSyncStatus = "synced" | "pending" | "syncing";
export type MenuPos = { top?: number; bottom?: number; right: number };
