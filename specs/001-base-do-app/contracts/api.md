# Contrato: API (Etapa 1)

Nesta etapa a API só existe como esqueleto, com uma rota. Servida em `/api` no mesmo domínio da interface (Caddy em
produção, *rewrite* do Next.js em desenvolvimento).

## `GET /api/health`

Sem login. Usado pelo painel de desenvolvimento e pelo monitoramento futuro.

**200 OK** — tudo no ar:

```json
{ "status": "ok", "version": "0.1.0", "checks": { "database": "ok", "redis": "ok" } }
```

**503 Service Unavailable** — alguma dependência fora:

```json
{ "status": "degraded", "version": "0.1.0", "checks": { "database": "ok", "redis": "error" } }
```

Regras:

- Cada verificação tem tempo limite de 2 segundos.
- A resposta nunca inclui mensagens de erro internas, endereços ou credenciais.
- Documentação interativa da API (`/docs`, `/openapi.json`) só existe com `APP_ENV=development`.

## Formato de erro (padrão para as próximas etapas)

```json
{ "error": { "code": "not_found", "message": "Apartamento não encontrado.", "details": {} } }
```

`code` usa os mesmos valores de `ServiceErrorCode` (`contracts/servicos-dados.md`); `message` em português.
