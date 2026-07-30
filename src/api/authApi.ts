import { apiUrl } from "../config/env";
import { api } from "../utils/apiClient";
import { setAccessToken } from "../utils/authToken";
import type { CurrentUser } from "./types";

export const authApi = {
  /**
   * Dang nhap Google KHONG PHAI la 1 fetch() call thong thuong - day la 1
   * DIEU HUONG TRANG (full-page redirect). Trinh duyet se roi khoi SPA, di
   * toi endpoint OAuth2 cua Spring Security tren backend, sang trang consent
   * cua Google, roi Google redirect nguoc ve backend, backend redirect tiep
   * ve FRONTEND_REDIRECT_URL kem "?token=..." (xem OAuth2LoginSuccessHandler,
   * SEC-01 + SEC-06). Vi vay ham nay khong tra ve Promise co du lieu - no chi
   * doi huong trang, code SPA hien tai se bi huy.
   */
  loginWithGoogle: (): void => {
    window.location.href = apiUrl("/oauth2/authorization/google");
  },

  /**
   * Goi 1 LAN DUY NHAT ngay khi trang "/oauth/callback" duoc load (sau khi
   * Google redirect ve, xem authApi.loginWithGoogle). Doc "token" tu query
   * string cua URL hien tai, luu vao memory (authToken.ts) de cac API call
   * tiep theo tu dong gan vao header Authorization.
   *
   * Tra ve true neu tim thay va luu token thanh cong, false neu khong co
   * token trong URL (VD nguoi dung vao thang "/oauth/callback" ma khong qua
   * luong dang nhap - truong hop loi, nen redirect ve trang login).
   */
  handleOAuthCallback: (): boolean => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return false;

    setAccessToken(token);
    // Xoa token khoi URL ngay sau khi doc xong - tranh no nam lai trong
    // browser history/log server neu nguoi dung copy-paste URL cho ai do.
    window.history.replaceState({}, "", window.location.pathname);
    return true;
  },

  /** GET /api/auth/me - lay thong tin user hien tai (dua vao JWT trong header) */
  me: (): Promise<CurrentUser> => api.get<CurrentUser>("/api/auth/me"),

  /**
   * POST /api/auth/logout - thu hoi refresh token cua PHIEN HIEN TAI (khong
   * anh huong thiet bi khac) + backend tu xoa cookie httpOnly. Sau khi goi
   * xong, PHAI tu xoa access token khoi memory o phia FE (backend khong lam
   * duoc viec nay vi access token la stateless JWT, khong "thu hoi" duoc).
   */
  logout: async (): Promise<void> => {
    await api.post<{ message: string }>("/api/auth/logout");
    setAccessToken(null);
  },

  /** POST /api/auth/logout-all - thu hoi TOAN BO refresh token cua user (moi thiet bi) */
  logoutAllDevices: async (): Promise<void> => {
    await api.post<{ message: string }>("/api/auth/logout-all");
    setAccessToken(null);
  },
};
