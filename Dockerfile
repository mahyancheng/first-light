FROM node:24-bookworm-slim AS test
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY public ./public
COPY test ./test
RUN node --test test/*.test.mjs && node src/build.mjs
FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -r /var/lib/apt/lists/* && npm install -g @openai/codex@0.151.0-alpha.2
WORKDIR /app
COPY --from=test --chown=node:node /app/dist ./
ARG BUILD_SHA=unknown
ENV NODE_ENV=production PORT=3111 DATA_PATH=/data/game.sqlite BUILD_SHA=$BUILD_SHA
RUN mkdir -p /data /home/node/.codex && chown -R node:node /data /home/node/.codex
USER node
EXPOSE 3111
CMD ["node","src/server.mjs"]
