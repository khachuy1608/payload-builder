# syntax=docker/dockerfile:1
# Image production cho Payload Page Builder (Next.js standalone)

FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- cài dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build không cần kết nối DB (các trang đều render động); secret tạm chỉ để nạp config
RUN PAYLOAD_SECRET=build-only-secret DATABASE_URI=postgres://build:build@localhost:5432/build npm run build

# ---- chạy ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs \
    && mkdir -p /app/media && chown nextjs:nodejs /app/media
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
# Migration trong src/migrations tự chạy khi server khởi động (prodMigrations)
CMD ["node", "server.js"]
