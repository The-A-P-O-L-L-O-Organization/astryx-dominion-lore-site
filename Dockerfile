FROM node:lts-alpine AS base

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate
RUN apk add --no-cache git curl

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/lore.db
ENV CONTENT_DIR=/data/repos

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN mkdir -p /scripts
COPY scripts/poll-cron.sh /scripts/poll-cron.sh
RUN chmod +x /scripts/poll-cron.sh
RUN echo "*/5 * * * * /scripts/poll-cron.sh" | crontab -

EXPOSE 3000

CMD ["node", "server.js"]
