// Access token (JWT) duoc giu trong BIEN MEMORY don gian (module-scope),
// KHONG luu vao localStorage/sessionStorage.
//
// Ly do (khop quyet dinh bao mat da thong nhat o backend SEC-06): neu luu
// access token vao localStorage, bat ky doan script nao chay duoc tren trang
// (XSS) deu doc truc tiep duoc token va gia mao nguoi dung. Giu trong memory
// (bien JS thuan) nghia la token bien mat khi F5/dong tab - chap nhan duoc vi
// luc do apiClient se tu goi /api/auth/refresh (dua vao cookie httpOnly refresh_token,
// JS khong doc duoc cookie nay) de lay access token moi ma khong can dang nhap lai.

let currentAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}
