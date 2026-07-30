// DTO types khop CHINH XAC voi response cua backend (xem noted-backend,
// package dto/response) - giu 2 phia dong bo, doi ten field o backend thi
// phai sua lai o day.

export type SyncState = "SYNCED" | "PENDING_DRIVE" | "DRIVE_FAILED" | "CONFLICT";

/** Khop com.noted.backend.dto.response.NoteSummaryResponse - dung cho danh sach sidebar */
export type NoteSummary = {
  id: number;
  displayName: string;
  syncState: SyncState;
  updatedAt: string; // ISO datetime string
};

/** Khop com.noted.backend.dto.response.NoteDetailResponse - dung khi mo tab, co noi dung */
export type NoteDetail = NoteSummary & {
  content: string;
};

/** Khop com.noted.backend.dto.response.BulkDeleteResponse */
export type BulkDeleteResult = {
  requestedCount: number;
  deletedCount: number;
  deletedIds: number[];
};

/** Khop response cua GET /api/notes/check-name */
export type CheckNameResult = {
  taken: boolean;
  suggestion: string;
};

/** Khop response cua GET /api/drive/status */
export type DriveStatus = {
  connected: boolean;
  folderId: string;
};

/** Khop response cua GET /api/auth/me */
export type CurrentUser = {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string;
  driveConnected: boolean;
};

/** Khop com.noted.backend.dto.request.SyncBatchItem (chieu gui LEN server) */
export type SyncBatchItem = {
  noteId: number | null;
  clientTempId: string | null;
  displayName: string;
  content: string;
  localUpdatedAtEpochMs: number;
};

/** Khop 1 phan tu trong mang "results" tra ve tu POST /api/sync/batch */
export type SyncBatchResultItem = {
  noteId?: number;
  clientTempId?: string;
  status: "created" | "synced" | "conflict" | "not_found_on_server" | "error";
  serverId?: number;
  serverUpdatedAt?: string;
  message?: string;
};
