# One image for production: the Express API, which also serves the built web app.
# Built and pushed to Docker Hub by the `deploy` job in .github/workflows/pipeline.yml; Render runs it.
# Local try-out:  docker build -t visionquest .
#                 docker run --rm -p 3000:3000 --env-file apps/api/.env visionquest

# --- build the web app (all dependencies, including dev tools like the bundler) ---
FROM node:22-slim AS web
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @vq/web

# --- runtime: production dependencies only ---
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev && npm cache clean --force

COPY packages/shared packages/shared
COPY apps/api apps/api
COPY seed seed
COPY --from=web /app/apps/web/dist apps/web/dist

# GIT_SHA lets /api/health report which commit is live (the deploy smoke test waits for it).
ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA \
    WEB_DIR=/app/apps/web/dist \
    PORT=3000
EXPOSE 3000
USER node
# tsx directly (not `npm start`) so the server itself receives SIGTERM from Render and shuts down cleanly.
CMD ["node_modules/.bin/tsx", "apps/api/src/server.ts"]
