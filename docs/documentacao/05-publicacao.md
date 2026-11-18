# Publicação

Como o Térreo fica no ar. Hoje: a **demonstração** (dados fictícios no aparelho) no Cloudflare Workers (com arquivos
estáticos) e a **base da API** (FastAPI, worker, PostgreSQL e Redis) numa VPS, pronta para a Etapa 3.

```
Navegador ──► terreo.v2n.tech (Cloudflare Worker "terreo": telas estáticas de web/out + repasse de /api/*)
                    │  /api/*  repassado pelo Worker
                    ▼
              terreo-api.v2n.tech ──► Cloudflare Tunnel "terreo-prod" ──► cloudflared ──► api (:8100) ──► db / redis
                                                                     └────── rede interna do projeto terreo-prod ──────┘
```

- **Frontend:** `web/` compilado como exportação estática (`npm run build:demo`) e publicado como Worker com arquivos
  estáticos (`web/wrangler.jsonc`). O Worker (`web/worker/index.js`) só roda em `/api/*`, que ele repassa para a API
  (`API_ORIGIN`), para o navegador falar sempre com o mesmo domínio (cookie de sessão da Etapa 3, sem CORS); o resto vem
  direto dos arquivos. `web/public/_headers` define os cabeçalhos de segurança e deixa o piloto fora dos buscadores.
- **API:** `infra/compose.prod.yaml` (projeto `terreo-prod`). **Nenhuma porta é publicada**: o público chega só pelo
  túnel do próprio Térreo. As migrações (Alembic) rodam antes de a API subir; a documentação `/docs` fica fechada fora
  do desenvolvimento.

## VPS compartilhada (por enquanto)

A VPS (Hostinger KVM 2, Ubuntu 24.04, usuário `vinicius`, SSH só com chave) também hospeda outro projeto. O Térreo fica
**totalmente separado**: pasta `~/terreo`, projeto Compose `terreo-prod`, rede `terreo-prod_default`, volumes
`terreo-prod_db-data` e `terreo-prod_redis-data`, túnel e conta Cloudflare próprios (V2N). Nada do outro projeto é
alterado. Limites de memória: banco 512 MB, API 512 MB, worker 256 MB, Redis 128 MB, cloudflared 128 MB.

**Remover o Térreo da VPS** (quando tiver servidor próprio): `cd ~/terreo/infra && docker compose -f
compose.prod.yaml --env-file .env down -v`, apagar `~/terreo` e a linha do `crontab`. Antes, faça a última cópia do
banco (`infra/backup.sh`) e leve o arquivo para o servidor novo.

## 1. Cloudflare: domínio (conta da V2N)

1. **Add a domain** → `v2n.tech` → plano Free. Conferir os registros importados (e-mail/MX, se houver).
2. No registrador do `v2n.tech`, trocar os nameservers pelos dois que a Cloudflare mostrar. Esperar o domínio ficar
   **Active**.
3. **Cuidado:** adicionar o domínio de novo (ou noutra conta) gera outro par de nameservers; o certo é o da conta onde
   estão o túnel e o Pages.

## 2. Cloudflare: túnel da API

1. **Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared** → nome `terreo-prod`. Copiar o **token** (não
   colar em chat nem em commit).
2. **Routes / Public hostname**: `terreo-api.v2n.tech` → serviço `http://api:8100`. A Cloudflare cria o DNS.
   (Um nível só abaixo de `v2n.tech`: o certificado grátis cobre `*.v2n.tech`, não `*.terreo.v2n.tech`.)

## 3. VPS: código e segredos

```bash
git clone https://github.com/vinicim002/terreo-app.git ~/terreo
cd ~/terreo/infra && cp prod.env.example .env && chmod 600 .env
sed -i "s|^DB_PASSWORD=$|DB_PASSWORD=$(openssl rand -hex 24)|" .env        # senha gerada no próprio servidor
read -rsp "Token do túnel: " T && sed -i "s|^TUNNEL_TOKEN=$|TUNNEL_TOKEN=$T|" .env && unset T; echo
grep -E "^[A-Z0-9_]+=" .env | sed -E "s/=.+/=(preenchido)/"                # conferir sem mostrar valores
```

## 4. Publicar a API

```bash
~/terreo/infra/deploy.sh
curl -s https://terreo-api.v2n.tech/api/health      # {"status":"ok",...}
```

Cópia diária do banco (14 dias em `infra/backups/`):

```bash
crontab -e
# 40 3 * * * /home/vinicius/terreo/infra/backup.sh >> /home/vinicius/terreo-backup.log 2>&1
```

## 5. Cloudflare Workers: a demonstração

1. **Workers & Pages → Create → Import a repository** → conta do GitHub `vinicim002` (app da Cloudflare instalado só
   no `terreo-app`) → `terreo-app`. **Não** usar "Clone a public repository" (criaria uma cópia em outra conta).
2. Configuração: nome `terreo`; **Build command** `npm run build:demo`; **Deploy command** `npx wrangler deploy`;
   **Root directory** (Advanced) `web`; variável de **build** `NODE_VERSION=22`. O resto (arquivos, `API_ORIGIN`) vem do
   `web/wrangler.jsonc`.
3. **Settings → Domains & Routes → Add → Custom domain** → `terreo.v2n.tech`.
4. Conferir: `https://terreo.v2n.tech` (faixa "Demonstração") e `https://terreo.v2n.tech/api/health`.

Cada push na `main` publica uma demonstração nova; o app instalado a recebe na abertura seguinte. A API só muda com
`infra/deploy.sh` na VPS.

## Dia a dia

| Tarefa | Comando (em `~/terreo`) |
|---|---|
| Publicar a API | `infra/deploy.sh` |
| Ver o que está rodando | `docker compose -f infra/compose.prod.yaml --env-file infra/.env ps` |
| Logs | `docker compose -f infra/compose.prod.yaml --env-file infra/.env logs -f --tail=100 api` (ou `worker`, `cloudflared`) |
| Abrir o banco | `docker compose -f infra/compose.prod.yaml --env-file infra/.env exec db psql -U terreo` |

## Próximos passos

- Na Etapa 3, quando a API tiver login, limitar o acesso direto a `terreo-api.v2n.tech` (só pela função do Pages,
  com um cabeçalho secreto ou Cloudflare Access).
- Levar as cópias do banco para fora da VPS (R2).
- Versão real (`build:real`) num domínio próprio quando a Etapa 3 estiver pronta.
