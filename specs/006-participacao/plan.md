# Plano de implementação: Participação

**Branch**: `main` | **Data**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/006-participacao/spec.md` (com esclarecimentos de 2026-11-18)

## Resumo

Sugestões com votos, melhorias, avisar problema, aviso de barulho anônimo, prestadores e comércio indicados e pesquisa
de satisfação por trimestre, com dados no aparelho sobre as specs 001 a 005. Votos, apoios e indicações em lojas
próprias (um por pessoa pela chave). Aprovar sugestão cria a melhoria ligada e avisa os "gostei". O aviso de barulho
**não tem autor** no registro; "meus avisos" e o intervalo de 30 minutos ficam só no aparelho. Prestadores e comércios
são uma entidade (`Listing`) com indicações de qualquer perfil. Decisões em [research.md](research.md).

## Contexto técnico

**Linguagem/Versão**: TypeScript (interface); a API não muda nesta spec

**Dependências principais**: as das specs anteriores; **nenhuma nova** (`resizePhoto`, `normalizeDialable`,
`DictateButton` reaproveitados)

**Armazenamento**: IndexedDB v6 — lojas novas: `suggestions`, `suggestionVotes`, `improvements`, `issues`,
`issueSupports`, `noiseReports`, `listings`, `recommendations`, `surveyResponses`; `localStorage` só para os próprios
avisos de barulho

**Testes**: Vitest (serviços, permissões, aprovar→melhoria, anonimato, médias, trimestre com relógio); Playwright
(sugestão e voto, aprovar, problema com foto e apoio, barulho anônimo, prestadores, pesquisa, melhorias) + axe

**Plataforma alvo / Tipo de projeto**: os mesmos (PWA)

**Metas**: CS-001 a CS-006

**Restrições**: barulho sem autor em qualquer lugar visível; sugestão "sem apto" esconde só dos vizinhos; nada desta
spec vai ao grupo do WhatsApp

**Escala/Escopo**: ~16 telas novas; 48 apartamentos

## Verificação da constituição

| Princípio | Como o plano cumpre | Situação |
|---|---|---|
| I. Português | pt/en/es; datas em Brasília | ✔ |
| II. Documentação | `02-funcionalidades.md` (Participação → "Em construção"), `03-arquitetura.md`, backlog, changelog | ✔ |
| III. Segurança e dados | Barulho anônimo de verdade (sem autor gravado); sugestão sem apto escondida dos vizinhos; problema privado só para autor, casa e síndico; permissões nos serviços | ✔ |
| IV. Para qualquer pessoa | Botões grandes de escolha (onde, o que houve), estrelas grandes, ditar descrições, fotos pela câmera | ✔ |
| V. WhatsApp junto | Respostas a quem sugeriu e atualizações de problema seguem a preferência "Avisos" (privado só se ligado); o resto só no app; envios pela fila na Etapa 3 | ✔ |
| VI. Stack combinada | Nenhuma dependência nova | ✔ |
| VII. Pronto é verificado | Testes de cada regra; `quickstart.md`; pytest na Etapa 3 (backlog) | ✔ |
| Restrições | Multi-condomínio; unidade = apartamento; front-end primeiro | ✔ |

**Pós-design (Fase 1)**: reavaliado depois de `data-model.md` e `contracts/`; nenhuma violação.

## Estrutura do projeto

```text
specs/006-participacao/  spec · plan · research · data-model · quickstart · contracts/{servicos,permissoes,rotas} · tasks
web/
├── app/  resident/{suggestions,suggestion,improvements,report-issue,noise-report,providers,local-shops,
│         satisfaction-survey}/ · front-desk/{improvements,report-issue,providers,local-shops}/ ·
│         manager/{suggestions,improvements,improvement/edit,issues,noise-reports,providers,local-shops,satisfaction}/
├── src/
│   ├── services/  suggestions.ts · improvements.ts · issues.ts · noise.ts · listings.ts · survey.ts ·
│   │              participation-shared.ts · notify.ts (tipos novos) · schemas · contracts · permissions ·
│   │              local/seed-participation.ts (SEED_VERSION 6, banco v6)
│   └── components/ suggestions/ · improvements/ · issues/ · noise/ · listings/ · survey/
└── tests/  unit: suggestions · improvements · issues · noise · listings · survey · permissions-006 · seed-v6
            e2e: suggestions · issues · noise · listings · survey · improvements
```

**Decisão de estrutura**: segue as specs anteriores; uma pasta de componentes por funcionalidade.

## Mudanças em `docs/`

`02-funcionalidades.md` (Participação), `03-arquitetura.md` (barulho anônimo, votos e indicações, sugestão →
melhoria), backlog (Etapa 3: fotos no R2, contador anônimo de barulho no servidor, pytest), changelog.

## Acompanhamento de complexidade

Sem violações: nenhuma dependência nova.
