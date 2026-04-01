FROM node:20-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build
EXPOSE 3000
WORKDIR /app/artifacts/api-server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
