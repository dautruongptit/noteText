// Tap trung moi truy cap import.meta.env vao 1 file duy nhat, tranh rai rac
// "import.meta.env.VITE_XXX" o nhieu noi trong code (kho grep/refactor sau nay).
//
// LUU Y quan trong ve Vite: bien VITE_* duoc thay the TRUC TIEP vao code luc
// BUILD (build-time), khong doc duoc luc runtime nhu bien moi truong server
// thong thuong. Vi vay khi deploy qua Docker, cach "chuan" la de VITE_API_BASE_URL
// RONG va dung nginx reverse proxy (xem nginx/default.conf.template) thay vi
// phai build lai image moi khi doi backend URL.
export const env = {
  // Rong = goi API bang duong dan tuong doi ("/api/...") - dung cho production
  // qua nginx proxy. Co gia tri = goi thang toi host do - dung cho `pnpm dev`
  // local khong qua proxy.
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, ""),
};

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${env.apiBaseUrl}${normalizedPath}`;
}
