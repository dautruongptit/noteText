import { api } from "../utils/apiClient";
import type { SyncBatchItem, SyncBatchResultItem } from "./types";

export const syncApi = {
  /**
   * POST /api/sync/batch - endpoint danh RIENG cho co che offline-first (xem
   * SEC-05 + useOfflineSync.ts): goi 1 LAN kem toan bo thay doi dang cho
   * trong IndexedDB, ngay khi mang vua online lai. Server so sanh
   * localUpdatedAtEpochMs tung item voi ban dang co de phat hien conflict,
   * KHONG tu y ghi de neu ban server moi hon.
   *
   * KHONG goi ham nay truc tiep cho luu note thong thuong (auto-save/Ctrl+S)
   * - truong hop do dung notesApi.updateContent(). syncApi.batch() CHI dung
   * khi can day lai hang loat thay doi bi lo do mat ket noi truoc do.
   */
  batch: (items: SyncBatchItem[]): Promise<{ results: SyncBatchResultItem[] }> =>
    api.post<{ results: SyncBatchResultItem[] }>("/api/sync/batch", items),
};
