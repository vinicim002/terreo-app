#!/usr/bin/env bash
# Cópia diária do banco do Térreo em infra/backups/, guardando 14 dias. Agendar no crontab da VPS:
#   40 3 * * * /home/vinicius/terreo/infra/backup.sh >> /home/vinicius/terreo-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")"
file="terreo-$(date +%F-%H%M).dump"
docker compose -f compose.prod.yaml --env-file .env exec -T db pg_dump -U terreo -d terreo -Fc -f "/backups/$file"
find backups -name 'terreo-*.dump' -mtime +14 -delete
echo "$(date -Is) cópia $file"
