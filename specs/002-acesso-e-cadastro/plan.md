# Plano de implementação: Acesso e cadastro

**Branch**: `main` | **Data**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/002-acesso-e-cadastro/spec.md` (com esclarecimentos de 2026-11-16)

## Resumo

Trocar a escolha de perfil provisória da spec 001 por entrada de verdade com celular e código, ainda com dados no
aparelho (front-end primeiro). Separa **Pessoa** dos **papéis** (morador de um apartamento, porteiro, síndico), com
sessão por aparelho, código simulado com as regras reais (10 min, 5 erros, 60 s, 5 por hora), primeiro acesso com
boas-vindas e regras, perfil com foto, carros, animais e contato de emergência, convites e permissões do responsável,
lista de apartamentos do síndico e consulta restrita da portaria. Todas as permissões são conferidas nos serviços,
por uma matriz única. Decisões em [research.md](research.md).

## Contexto técnico

**Linguagem/Versão**: TypeScript (interface); a API não muda nesta spec

**Dependências principais**: as da spec 001; nova: `libphonenumber-js` (celular por país, research R5)

**Armazenamento**: IndexedDB (novas lojas: pessoas, moradores, síndico, carros, animais, contatos, regras, pedidos de
código, sessões, mensagens simuladas); `localStorage` para o `deviceId` e as preferências

**Testes**: Vitest (serviços, permissões, código, sessão, celular, placas, foto, seed); Playwright (fluxos das 5
histórias em Pixel 7 e iPhone 14) + axe nas telas novas

**Plataforma alvo**: a mesma da spec 001

**Tipo de projeto**: aplicação web (PWA); sem mudança na API

**Metas de desempenho**: CS-001 a CS-005 (tempos de tarefa); as telas novas não podem piorar o Lighthouse da 001

**Restrições**: nada de CPF/nascimento/documento; código nunca aparece no modo `real`; atalho de testes só em
`dev`/`demo`; textos nos três idiomas; dados de exemplo fictícios

**Escala/Escopo**: ~15 telas novas, 1 condomínio, ~150 pessoas de exemplo

## Verificação da constituição

| Princípio | Como o plano cumpre | Situação |
|---|---|---|
| I. Português | Textos da interface em arquivos de tradução (pt/en/es); rotas e código em inglês; datas no fuso de Brasília | ✔ |
| II. Documentação | `02-funcionalidades.md` (situação de login, cadastro, convite, perfil, regras, boas-vindas → "Em construção"/"Pronta"), `03-arquitetura.md` (pessoa e papéis, sessão local), backlog e changelog atualizados | ✔ |
| III. Segurança e dados | Sem CPF/nascimento/documento; código guardado só como hash; mensagens de erro sem revelar motivo; matriz de permissões nos serviços; portaria só vê nome, foto, tipo e carros; atalho de testes ausente no modo `real` | ✔ com desvio temporário (sessão no aparelho, ver complexidade) |
| IV. Para qualquer pessoa | Entrada sem senha, toques ≥ 44 px, letra grande, alto contraste, auditoria axe nas telas novas | ✔ |
| V. WhatsApp junto | Código e convite "enviados" pelo WhatsApp do condomínio (simulado, com a mensagem pronta para a fila da Etapa 3) | ✔ |
| VI. Stack combinada | Só `libphonenumber-js` nova, justificada abaixo | ✔ com justificativa |
| VII. Pronto é verificado | Testes de cada regra da matriz, do código e da sessão; `quickstart.md` antes da implementação | ✔ |
| Restrições: sessão | "Cookie httpOnly com token, banco guarda só o hash" vale para a API (Etapa 3); aqui não há servidor | desvio justificado |
| Restrições: unidade = apartamento | Só o responsável convida; um responsável por apartamento | ✔ |

**Pós-design (Fase 1)**: reavaliado depois de `data-model.md` e `contracts/`; nenhuma violação nova.

## Estrutura do projeto

### Documentação (esta funcionalidade)

```text
specs/002-acesso-e-cadastro/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/
│   ├── servicos.md       # novos serviços e mudança no ServiceContext
│   ├── permissoes.md     # matriz conferida nos serviços
│   └── rotas.md          # telas novas e guarda de acesso
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Código (mudanças em `web/`)

```text
web/
├── app/
│   ├── page.tsx                     # redireciona (substitui a escolha de perfil)
│   ├── login/ · login/code/ · choose-role/ · welcome/ · rules-accept/
│   ├── resident/  profile/ · profile/edit/ · invite/ · person/ · vehicle/ · pet/ · emergency-contact/ · rules/ · welcome/
│   ├── front-desk/  residents/ · rules/
│   └── manager/  residents/ · apartment/ · apartment/register/ · person/ · rules/
├── messages/{pt,en,es}.json         # textos novos
├── src/
│   ├── auth/                        # deviceId, sessão atual (hook), AccessGuard (substitui ProfileGuard), atalho de testes
│   ├── phone/                       # normalização e validação (libphonenumber-js), PhoneInput com país
│   ├── photo/                       # redução para 512 px
│   ├── services/
│   │   ├── contracts.ts · schemas.ts # Role, Actor, novas entidades e ServiceError "rate_limited"
│   │   ├── permissions.ts            # can(actor, ação, alvo) — matriz de contracts/permissoes.md
│   │   ├── auth.ts · residency.ts · apartment-admin.ts · apartment-data.ts · directory.ts · rules.ts · outbox.ts
│   │   └── local/seed.ts · local/db.ts  # SEED_VERSION 2, lojas novas
│   ├── navigation/screens.ts        # telas novas no catálogo; "Moradores" e "Regras" em "Mais" da portaria
│   └── components/                  # telas e formulários das histórias
└── tests/
    ├── unit/  auth · session · permissions · residency · apartment-admin · directory · phone · plate · photo · seed-v2
    └── e2e/   login · onboarding · household · profile · manager-residents · front-desk-directory · a11y (telas novas)
```

**Decisão de estrutura**: segue a spec 001. Os serviços ganham módulos por área em vez de crescer `core.ts`; a matriz
de permissões fica num arquivo só, usado por todos os serviços e pelos testes. As telas vazias da spec 001 que passam a
ter conteúdo (perfil, convite, regras, moradores) ganham pasta própria, que tem prioridade sobre `[screen]`.

## Mudanças em `docs/`

- `02-funcionalidades.md`: login, cadastro de apartamentos, convite, perfil, boas-vindas e regras → "Em construção"
  (dados locais) — "Pronta" só com a API.
- `03-arquitetura.md`: pessoa e papéis, sessão no aparelho (provisória), envio simulado, portaria com consulta
  restrita; pastas novas em "Onde está cada coisa".
- `docs/backlog.md` (Etapa 2, primeiro item) e `docs/changelog.md`.

## Acompanhamento de complexidade

| Acréscimo ou desvio | Por que é necessário | Alternativa mais simples rejeitada porque |
|---|---|---|
| `libphonenumber-js` | Validar celulares de qualquer país (RF-001a) e normalizar para não duplicar cadastros (RF-017) | Regex própria só cobriria o Brasil e erraria nos outros formatos |
| Sessão e código guardados no aparelho, em vez de cookie httpOnly e servidor | Front-end primeiro: não há API até a Etapa 3; o fluxo e as regras ficam prontos e testados | Esperar a API atrasaria a validação das telas com o síndico; sem dado real, o risco é nulo. Na Etapa 3, `auth` passa a chamar a API e a sessão vai para o cookie |
| Atalho `__terreoDev.signInAs` | Testes e2e entram direto sem repetir o fluxo do código em cada teste | Repetir o fluxo em todo teste deixaria a suíte lenta e frágil; o atalho não existe no modo `real` |
