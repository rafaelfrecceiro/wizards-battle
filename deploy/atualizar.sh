#!/usr/bin/env bash
# Atualiza a produção com o main publicado. Uso na VPS: cd /opt/wizards-battle && bash deploy/atualizar.sh
# Só avança por fast-forward; salas salvas ficam no volume `dados` (o rebuild não as apaga).
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
WB_COMMIT="$(git rev-parse --short HEAD)" docker compose up -d --build
docker image prune -f >/dev/null
docker compose ps
