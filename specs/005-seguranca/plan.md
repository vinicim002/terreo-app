# Plano de implementação: Segurança

**Branch**: `main` | **Data**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/005-seguranca/spec.md` (com esclarecimentos de 2026-11-18)

## Resumo

Botão de emergência, alerta geral, contatos importantes e histórico, com dados no aparelho, sobre as specs 001 a 004.
Duas entidades de alerta (de apartamento e geral). Um `EmergencyWatcher` em todos os perfis consulta a cada 3 s e abre a
tela cheia (portaria: alertas de apartamento; todos: alerta geral); na Etapa 3, push e tempo real substituem a consulta.
O `notify` ganha o alerta geral, a única exceção que vai ao grupo **e** ao privado de todos; o contato de emergência
recebe mensagem direta. O `runDue` repete o alerta sem atendimento em 2 min. "SOS"/"socorro" pelo WhatsApp entra no
`whatsappInbox` da spec 004. Decisões em [research.md](research.md).

## Contexto técnico

**Linguagem/Versão**: TypeScript (interface); a API não muda nesta spec

**Dependências principais**: as das specs anteriores; **nenhuma nova** (vibração e som do navegador)

**Armazenamento**: IndexedDB — lojas novas: alertas de apartamento, alertas gerais, vistos, contatos (banco v5);
`Person.showPhoneInContacts`

**Testes**: Vitest (serviços, permissões, canais, repetição com relógio, SOS, números discáveis); Playwright (segurar
3 s, tela cheia na portaria, "Estou indo", cancelar, alerta geral, contatos) + axe nas telas novas

**Plataforma alvo / Tipo de projeto**: os mesmos (PWA)

**Metas**: CS-001 a CS-006a; telas de alerta com contraste alto e botões ≥ 56 px

**Restrições**: emergência e alerta geral ignoram preferências; celular do síndico e do porteiro-chefe só com
autorização; contato de emergência só recebe mensagem quando o apartamento pede ajuda

**Escala/Escopo**: ~8 telas novas e 2 telas cheias; 48 apartamentos

## Verificação da constituição

| Princípio | Como o plano cumpre | Situação |
|---|---|---|
| I. Português | pt/en/es; datas em Brasília | ✔ |
| II. Documentação | `02-funcionalidades.md` (Segurança → "Em construção"), `03-arquitetura.md` (watcher, canais), backlog, changelog | ✔ |
| III. Segurança e dados | Permissões nos serviços; celular pessoal só com autorização; contato de emergência só recebe o necessário; nada de emergência no grupo (só o alerta geral, que é do prédio) | ✔ |
| IV. Para qualquer pessoa | Botão grande com segurar 3 s (evita disparo), tela cheia de alto contraste, ditar a mensagem, botões ≥ 56 px | ✔ |
| V. WhatsApp junto | Emergências chegam a todos ignorando preferências; pedir ajuda também por "SOS" no WhatsApp (simulado) | ✔ |
| VI. Stack combinada | Nenhuma dependência nova | ✔ |
| VII. Pronto é verificado | Testes de cada regra; `quickstart.md`; pytest na Etapa 3 (backlog) | ✔ |
| Restrições | Multi-condomínio; unidade = apartamento (um alerta em aberto por apto); front-end primeiro | ✔ |

**Pós-design (Fase 1)**: reavaliado depois de `data-model.md` e `contracts/`; nenhuma violação.

## Estrutura do projeto

```text
specs/005-seguranca/  spec · plan · research · data-model · quickstart · contracts/{servicos,permissoes,rotas} · tasks
web/
├── app/  resident/{emergency,contacts}/ · front-desk/{contacts,general-alert,emergency-alert}/ ·
│         manager/{contacts,contacts/edit,general-alert,emergency-alert}/
├── src/
│   ├── services/  emergency.ts · contacts.ts · notify.ts (alerta geral) · due.ts (repetição) · front-desk.ts (SOS) ·
│   │              dialable.ts · schemas · contracts · permissions · local/seed-security.ts (SEED_VERSION 5, banco v5)
│   ├── components/ security/{HoldButton,EmergencyScreen,EmergencyWatcher,DeskEmergencyOverlay,GeneralAlertOverlay,
│   │              GeneralAlertForm,AlertHistory}.tsx · contacts/{ContactsScreen,ContactsEditor}.tsx
│   └── components/layout/ProfileShell.tsx (monta o watcher)
└── tests/  unit: emergency · general-alert · contacts · dialable · permissions-005 · due-005 · inbox (SOS) · seed-v5
            e2e: emergency · general-alert · contacts
```

**Decisão de estrutura**: segue as specs anteriores; o watcher é o único componente global novo.

## Mudanças em `docs/`

`02-funcionalidades.md` (Segurança), `03-arquitetura.md` (watcher, canais do alerta geral), backlog (Etapa 3: push e
tempo real para emergências; pytest; números das concessionárias com o síndico), changelog.

## Acompanhamento de complexidade

Sem violações: nenhuma dependência nova; a consulta a cada 3 s é provisória e documentada para a Etapa 3.
