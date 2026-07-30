import { apiUrl } from "../config/env";
import { getAccessToken, setAccessToken } from "./authToken";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// Dam bao CHI 1 request /api/auth/refresh duoc bay ra tai 1 thoi diem, ke ca
// khi nhieu request khac cung dong loat nhan 401 gan nhu cung luc (vd 3 tab
// note dang auto-save cung 1 giay). Neu khong co "single-flight" nay, ca 3
// request se cung goi /refresh song song -> refresh token bi ROTATE (xem
// backend SEC-06) boi request dau tien, 2 request refresh con lai se nhan
// "token da bi thu hoi" (reuse detection) va VO TINH lam nguoi dung bi
// dang xuat toan bo thiet bi mac du khong co gi bat thuong xay ra.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(apiUrl("/api/auth/refresh"), {
        method: "POST",
        credentials: "include", // BAT BUOC - gui kem cookie httpOnly refresh_token
      });
      if (!res.ok) {
        setAccessToken(null);
        return false;
      }
      const data = (await res.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      return true;
    } catch {
      setAccessToken(null);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown; // tu dong JSON.stringify neu khong phai FormData/string
  skipAuthRetry?: boolean; // tranh vong lap vo han khi chinh /refresh tra ve 401
};

// Phan dung chung giua apiFetch (JSON) va apiFetchBlob (file download): gan
// Authorization header, goi fetch, tu dong refresh 1 lan khi gap 401, roi
// tra ve Response THO (chua parse body) de moi ham goi tu quyet dinh parse
// kieu gi (json() hay blob()).
async function rawFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  const { body, skipAuthRetry, headers, ...rest } = options;

  const doFetch = () => {
    const token = getAccessToken();
    const finalHeaders: Record<string, string> = {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    };

    return fetch(apiUrl(path), {
      ...rest,
      headers: finalHeaders,
      credentials: "include", // luon gui kem cookie (can cho /api/auth/refresh, /logout)
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  // Access token het han (1 gio, xem SEC-06) -> thu refresh 1 LAN, khong lam
  // gian doan thao tac cua nguoi dung (khong hien loi, khong bat dang nhap lai
  // ngay - chi khi ban refresh CUNG that bai moi coi la phien da het han that su).
  if (res.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `Request that bai (${res.status})`;
    try {
      const errBody = await res.clone().json();
      code = errBody.code ?? code;
      message = errBody.message ?? message;
    } catch {
      // response khong phai JSON (vd loi 502 tu nginx/proxy, hoac loi tu 1 endpoint
      // tra binary nhu /download) - giu message mac dinh
    }
    throw new ApiError(res.status, code, message);
  }

  return res;
}

// Wrapper fetch dung chung cho toan bo app - moi noi goi API JSON deu nen di
// qua day thay vi goi fetch() truc tiep, de dam bao LUON co Authorization
// header + LUON tu dong thu refresh token 1 lan khi gap 401.
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await rawFetch(path, options);

  // 204 No Content (vd DELETE) khong co body de parse
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// Danh rieng cho endpoint tra ve file nhi phan (vd GET /api/notes/{id}/download).
// KHONG dung the <a href="..."> truc tiep duoc vi endpoint nay yeu cau JWT
// trong header Authorization - trinh duyet dieu huong (navigation) khong the
// gan header tuy y. Phai fetch bang JS (co Authorization) roi tu tao Blob URL.
export async function apiFetchBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const res = await rawFetch(path, options);
  return res.blob();
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
