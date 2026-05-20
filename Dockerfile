FROM node:22-alpine AS builder
WORKDIR /app

# Audit 3 CORS fix — Next.js bakea NEXT_PUBLIC_* en build time, NO toma del
# env_file del compose (que sólo aplica en runtime). Estos ARG se pasan desde
# docker-compose.yml:
#   build:
#     args:
#       NEXT_PUBLIC_API_BASE_URL: http://localhost:8080
#       NEXT_PUBLIC_APP_NAME: MiPIT PoC
ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG NEXT_PUBLIC_APP_NAME="MiPIT PoC"
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
