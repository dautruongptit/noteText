import { api } from "../utils/apiClient";
import type { DriveStatus } from "./types";

export const driveApi = {
  /** GET /api/drive/status - kiem tra user da ket noi Google Drive chua */
  status: (): Promise<DriveStatus> => api.get<DriveStatus>("/api/drive/status"),

  /**
   * GET /api/drive/connect - lay URL de bat dau luong xin quyen Drive (scope
   * "drive.file" + "access_type=offline", KHAC voi luong dang nhap thong
   * thuong o authApi.loginWithGoogle - xem DriveController, SEC-03).
   *
   * QUAN TRONG: ham nay KHONG tu dong redirect - no chi TRA VE authUrl, vi
   * hanh dong "ket noi Drive" nen la 1 lua chon RO RANG cua nguoi dung (vd
   * bam nut "Ket noi Google Drive" trong Settings), khong nen tu dong xay ra.
   * Component goi ham nay se tu quyet dinh: window.location.href = authUrl.
   */
  getConnectUrl: (): Promise<{ authUrl: string }> => api.get<{ authUrl: string }>("/api/drive/connect"),

  /**
   * POST /api/drive/sync-all - kich hoat dong bo THU CONG toan bo note dang
   * cho (PENDING_DRIVE) ngay lap tuc, thay vi doi job dinh ky 30s ben backend
   * (xem DriveSyncServiceImpl.runPendingSyncBatch, SEC-03). Dung khi nguoi
   * dung bam nut "Dong bo ngay" sau khi vua noi lai mang.
   */
  syncAll: (): Promise<{ message: string }> => api.post<{ message: string }>("/api/drive/sync-all"),

  /** DELETE /api/drive/disconnect - ngat ket noi Drive, xoa refresh token da luu */
  disconnect: (): Promise<{ message: string }> => api.delete<{ message: string }>("/api/drive/disconnect"),
};
