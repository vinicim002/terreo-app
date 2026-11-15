# Quickstart: validar a Base do app

Roteiro para provar que a spec 001 está pronta. Os cenários vêm da `spec.md`; detalhes em `contracts/` e
`data-model.md`.

## Pré-requisitos

- Docker e Docker Compose; `make`.
- Node.js e `uv` só se for rodar fora do Docker.
- Um celular Android e um iPhone na mesma rede (cenários de instalação).

## Subir o ambiente

```bash
cp .env.example .env
make dev            # db, redis, api, worker e web
```

Esperado: interface em `http://localhost:3100`, `http://localhost:3100/api/health` responde `{"status":"ok",...}`.

## Verificações automáticas

```bash
make lint           # ESLint + Prettier (web) e Ruff (api)
make test           # Vitest (web) e pytest (api)
make e2e            # Playwright em Pixel 7 e iPhone 14, com auditoria axe
```

Esperado: tudo verde. Os testes cobrem: chaves de tradução iguais nos três idiomas (RF-014), contraste dos tokens
(RF-018), isolamento por condomínio nos serviços (RF-026), dados de exemplo criados uma vez (RF-027).

## Cenários manuais

| # | Passos | Esperado | Spec |
|---|---|---|---|
| 1 | Abrir `/` num navegador limpo | Escolha de perfil | H1-1 |
| 2 | Escolher cada perfil e tocar em todas as seções da barra e de "Mais"/"Todos os serviços" | Tela certa, título certo, barra visível, sem recarregar | H1-2, H1-3, RF-007 |
| 3 | Com perfil morador, abrir `/manager` | "Esta tela é de outro perfil" | H1-5 |
| 4 | Abrir `/nao-existe` | "Página não existe" | H1-6 |
| 5 | Fechar e abrir o app | Volta ao mesmo perfil | H1-7 |
| 6 | Em `/settings`, trocar para inglês e espanhol | Todos os textos mudam na hora | H2-2 |
| 7 | Navegador em espanhol, dados limpos | App abre em espanhol | H2-1 |
| 8 | Ligar escuro, alto contraste, letra no máximo; recarregar | Mantido, sem piscar, sem rolagem lateral em 320 px | H2-3, H2-5, H2-6 |
| 9 | Celular em modo escuro com "seguir o celular" | App escuro; muda junto com o celular | H2-4 |
| 10 | Clicar no VLibras | Avatar traduz o texto selecionado | RF-019 |
| 11 | `/dev`: conferir README, situação da API, contagens (1 condomínio, 48 apartamentos, 5 funcionários) | Iguais ao repositório e ao `data-model.md` | H4-1, H5-1 |
| 12 | Recarregar várias vezes; depois "Restaurar dados de exemplo" | Contagens não mudam; restauração recria | H4-2, H4-3 |
| 13 | `/dev/progress`, `/dev/commits`, `/dev/docs` | Etapas com percentuais, 50 commits, documentos formatados | H5-2 a H5-5 |
| 14 | Editar `docs/backlog.md` e recarregar `/dev/backlog` | Conteúdo novo | H5-4 |

## Versão de demonstração e app instalável

```bash
make build-demo     # gera web/out com APP_MODE=demo
make serve-demo     # serve web/out em http://<ip-da-máquina>:3200
```

| # | Passos | Esperado | Spec |
|---|---|---|---|
| 15 | Abrir `/dev` na demonstração | "Página não existe" | H5-6, CS-008 |
| 16 | Conferir a faixa "Demonstração" em várias telas | Presente | RF-004a |
| 17 | Android: instalar pelo Chrome | Ícone e nome "Térreo"; abre em tela cheia com a cor da marca | H3-1, H3-3 |
| 18 | iPhone: "Adicionar à Tela de Início" | Ícone da marca sem bordas brancas | H3-2 |
| 19 | Abrir uma vez, ligar o modo avião, abrir telas nunca visitadas | Todas abrem, aviso de sem internet | H3-4 |
| 20 | Publicar nova versão, abrir duas vezes | Na segunda abertura, versão nova | H3-5 |

Observação: a instalação no celular exige HTTPS; nos cenários 17 a 20 use a demonstração publicada no Cloudflare Pages
ou um túnel HTTPS para a máquina.
