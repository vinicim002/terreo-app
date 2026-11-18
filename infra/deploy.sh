#!/usr/bin/env bash
# Publica uma versão nova da API do Térreo na VPS: atualiza o código, compila a imagem, sobe banco, Redis, API,
# worker e túnel, e espera a API responder. Uso: infra/deploy.sh [--sem-git]
set -euo pipefail
cd "$(dirname "$0")"
COMPOSE=(docker compose -f compose.prod.yaml --env-file .env)

[[ -f .env ]] || { echo "Falta infra/.env (copie de prod.env.example)." >&2; exit 1; }
[[ "$(stat -c %a .env)" == "600" ]] || { echo "infra/.env precisa de chmod 600." >&2; exit 1; }

if [[ "${1:-}" != "--sem-git" ]]; then
  git -C .. pull --ff-only
fi

mkdir -p backups
"${COMPOSE[@]}" build api
"${COMPOSE[@]}" up -d --remove-orphans

echo "Esperando a API ficar pronta..."
for _ in $(seq 1 60); do
  status=$("${COMPOSE[@]}" ps --format '{{.Health}}' api 2>/dev/null || true)
  if [[ "$status" == "healthy" ]]; then
    "${COMPOSE[@]}" ps
    echo "Térreo no ar ($(git -C .. log -1 --format='%h %s'))."
    exit 0
  fi
  sleep 3
done
echo "A API não ficou pronta. Veja: docker compose -f infra/compose.prod.yaml logs --tail=100 api" >&2
exit 1
