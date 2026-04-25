# Multi-stage Dockerfile for FlowForge
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++ git
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY . .
RUN pnpm --filter @flowforge/shared build \
 && pnpm --filter @flowforge/backend build \
 && pnpm --filter @flowforge/frontend build

FROM node:20-alpine AS runner
RUN apk add --no-cache tini
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Copy built artefacts and node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/backend/package.json ./packages/backend/
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
COPY --from=build /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=build /app/packages/frontend/dist ./packages/frontend/dist

VOLUME ["/app/packages/backend/data"]
WORKDIR /app/packages/backend
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
