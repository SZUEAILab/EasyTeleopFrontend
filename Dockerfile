FROM node:18-bullseye AS builder

ENV CI=true

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . /app/
RUN corepack enable && pnpm install --frozen-lockfile && pnpm build

FROM node:18-bullseye

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/next.config.mjs ./next.config.mjs

RUN corepack enable && pnpm install --prod --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "start"]
