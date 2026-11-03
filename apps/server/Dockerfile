FROM node:24-bookworm-slim AS build

RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/client/package.json apps/client/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --filter label-log-server... --frozen-lockfile
COPY apps/server apps/server
COPY packages/contracts packages/contracts
RUN pnpm --filter label-log-server build

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/client/package.json apps/client/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --filter label-log-server --prod --frozen-lockfile
COPY --from=build /repo/apps/server/dist apps/server/dist
COPY --from=build /repo/apps/server/drizzle apps/server/drizzle
WORKDIR /repo/apps/server

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
