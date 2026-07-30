// Buffer bang IndexedDB (KHONG dung localStorage cho phan nay - localStorage
// gioi han ~5-10MB va API dong bo/block main thread, khong phu hop voi noi
// dung note co the kha lon; IndexedDB bat dong bo, dung luong lon hon nhieu).
//
// Vai tro trong luong dong bo (da thong nhat truoc do):
//   1. Moi lan nguoi dung go chu -> ghi NGAY vao IndexedDB (luon thanh cong,
//      khong phu thuoc mang) TRUOC KHI thu goi API len server.
//   2. Neu goi API server thanh cong -> xoa entry khoi hang doi (removePending).
//   3. Neu goi API that bai (server khong toi duoc/mat mang) -> entry VAN CON
//      trong IndexedDB, danh dau "pending" tren UI, cho retry.
//   4. Khi co mang lai (window 'online' event) hoac dinh ky -> quet toan bo
//      pending, goi POST /api/sync/batch 1 lan cho ca danh sach (xem SEC-05
//      backend: SyncController.syncBatch()).
//
// Shape cua 1 pending change KHOP CHINH XAC voi SyncBatchItem ben backend
// (xem noted-backend/src/main/java/com/noted/backend/dto/request/SyncBatchItem.java)
// de khong can chuyen doi gi them khi gui len API.
export type PendingChange = {
  /** null neu note duoc tao MOI hoan toan trong luc offline (chua co id tu server) */
  noteId: number | null;
  /** id tam client tu sinh, CHI dung khi noteId = null, de server tra ve mapping id that */
  clientTempId: string | null;
  displayName: string;
  content: string;
  localUpdatedAtEpochMs: number;
};

const DB_NAME = "noted-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-changes";
// Key duy nhat cho 1 entry: noteId that (dang string) hoac clientTempId neu note moi
const keyOf = (change: PendingChange) => String(change.noteId ?? change.clientTempId);

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "_key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Ghi/ghi de 1 pending change. Goi ham nay MOI LAN noi dung note thay doi,
// truoc khi thu goi API - dam bao khong bao gio mat noi dung nguoi dung vua go
// du server/mang co van de gi di nua.
export async function savePending(change: PendingChange): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ ...change, _key: keyOf(change) });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Xoa 1 entry sau khi da dong bo len server THANH CONG.
export async function removePending(change: Pick<PendingChange, "noteId" | "clientTempId">): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(String(change.noteId ?? change.clientTempId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Lay toan bo pending changes hien co - dung khi mang vua online lai, can
// day het len server trong 1 lan goi /api/sync/batch.
export async function getAllPending(): Promise<PendingChange[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const results = (request.result as (PendingChange & { _key: string })[]).map(({ _key, ...rest }) => rest);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function pendingCount(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
