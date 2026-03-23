FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---

FROM node:24-alpine
WORKDIR /app

COPY --from=builder /app/build ./build
COPY entrypoint.sh /entrypoint.sh

RUN apk add --no-cache su-exec && chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
ENV PUID=1000
ENV PGID=1000

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "build"]
