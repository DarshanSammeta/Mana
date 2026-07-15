# Base image
FROM node:20-alpine AS base

# -----------------------------
# Dependencies
# -----------------------------
FROM base AS deps

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci --legacy-peer-deps

# -----------------------------
# Builder
# -----------------------------
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma

# Compile custom server and build Next.js
RUN npx esbuild server.ts --bundle --platform=node --outfile=server.js --external:next --external:socket.io --external:express
RUN npm run build

# -----------------------------
# Runner
# -----------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]