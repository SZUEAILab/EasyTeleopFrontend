FROM node:20-alpine AS builder

# Build-time envs so Next.js can inline public config during `pnpm build`
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MQTT_URL
ARG NEXT_PUBLIC_MQTT_USERNAME
ARG NEXT_PUBLIC_MQTT_PASSWORD
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_MQTT_URL=${NEXT_PUBLIC_MQTT_URL} \
    NEXT_PUBLIC_MQTT_USERNAME=${NEXT_PUBLIC_MQTT_USERNAME} \
    NEXT_PUBLIC_MQTT_PASSWORD=${NEXT_PUBLIC_MQTT_PASSWORD} \
    CI=true \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . /app/
RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
