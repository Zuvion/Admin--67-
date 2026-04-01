FROM node:20-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
# Build frontend
RUN NODE_ENV=production pnpm --filter @workspace/cryptexa-admin run build
# Build API server
RUN pnpm --filter @workspace/api-server run build
# Copy built frontend into API server's public dir (served as static files)
RUN cp -r artifacts/cryptexa-admin/dist artifacts/api-server/public
EXPOSE 3000
WORKDIR /app/artifacts/api-server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
