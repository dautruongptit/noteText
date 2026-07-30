# ==========================================================
# Stage 1 — Build tinh (Vite + React + TypeScript)
# ==========================================================
FROM node:20-alpine AS build
WORKDIR /app

# Cai dat pnpm (repo dung pnpm-lock.yaml)
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# VITE_API_BASE_URL duoc "bake" vao bundle tinh tai thoi diem BUILD (dac diem
# cua Vite: bien import.meta.env.* duoc thay the truc tiep vao code khi build,
# KHONG doc duoc luc runtime nhu bien moi truong server-side thong thuong).
# De trong (rong) la lua chon MAC DINH va DUOC KHUYEN NGHI cho deploy qua
# nginx reverse proxy (xem nginx/default.conf.template) - luc do FE goi API
# bang duong dan tuong doi ("/api/..."), cung origin voi frontend, khong dinh
# den 1 host:port backend cu the nao ca -> khong can build lai image moi khi
# doi backend URL.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN pnpm build

# ==========================================================
# Stage 2 — Serve bang Nginx, cong 85
# ==========================================================
FROM nginx:1.27-alpine

# Xoa config mac dinh, dung template rieng (xem giai thich trong file template)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

# Bien moi truong RUNTIME (khac VITE_API_BASE_URL o tren): day la bien nginx
# doc luc CONTAINER KHOI DONG (qua envsubst, xem template), dung de dung reverse
# proxy toi backend - THAY DOI DUOC MA KHONG CAN BUILD LAI IMAGE, chi can doi
# bien moi truong khi "docker run"/"docker compose up".
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=8085

EXPOSE 85

# nginx:1.27 image co san entrypoint tu dong chay envsubst tren moi file trong
# /etc/nginx/templates/*.template -> ghi ra /etc/nginx/conf.d/*.conf truoc khi
# nginx khoi dong - khong can viet entrypoint script rieng.
