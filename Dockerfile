# syntax=docker/dockerfile:1
# Wizards Battle: um contêiner só. O servidor Node serve a web (vite build), a API e as salas na mesma origem.
# Como implantar: DEPLOY.md. O contexto é a raiz do repositório; o .dockerignore deixa entrar só src/.

ARG NODE_IMAGE=node:24-bookworm-slim

# --- dependências (em cache enquanto o package.json não muda) -------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY src/package.json src/package-lock.json ./
RUN npm ci --no-audit --no-fund

# --- código + typecheck + build da web ----------------------------------------------------------
FROM deps AS build
COPY src/ ./
RUN npm run build
# Só as dependências de produção seguem (react, tsx, vite e as fontes); vite é importado pelo servidor.
RUN npm prune --omit=dev --no-audit --no-fund

# --- imagem final -------------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS servidor
WORKDIR /app
ARG WB_COMMIT=""
ENV NODE_ENV=production \
    WB_HOST=0.0.0.0 \
    WB_PORT=4200 \
    WB_SAVE_PATH=/dados/rooms.sqlite \
    WB_COMMIT=${WB_COMMIT}
COPY --from=build --chown=node:node /app ./
RUN mkdir -p /dados && chown node:node /dados
USER node
EXPOSE 4200
CMD ["node", "node_modules/tsx/dist/cli.mjs", "server/index.ts", "--production"]
