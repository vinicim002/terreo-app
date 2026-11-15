# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Converse com o usuário em português. A constituição em `.specify/memory/constitution.md` vale acima deste arquivo —
leia antes de especificar, planejar ou implementar.

## Regras de commit (obrigatórias)

- Formato: `<prefixo em inglês>: <descrição em português>` — ex.: `feat: adiciona cadastro de entregas`,
  `docs: atualiza README`, `chore: configura Spec Kit`.
- **Nunca** adicionar `Co-Authored-By` de IA (Claude, Cursor, Codex etc.), "Generated with" ou qualquer menção a
  ferramenta de IA em commits ou PRs. O autor é só a pessoa do projeto que fez o commit (git config dela).
- Commitar só quando o usuário pedir.
- Nunca versionar `.env`, senhas, chaves, credenciais ou dados reais de moradores. Conferir `git status` antes do
  commit. A pasta `arquivos-gerais-terreo/` está no `.gitignore` e não sobe.

## Documentação e PDF (obrigatório)

- `docs/documentacao/NN-*.md` (capítulos), `docs/backlog.md` e `docs/changelog.md` são a documentação oficial; o PDF
  `docs/pdf/terreo-documentacao.pdf` é gerado deles com `uv run scripts/gerar_pdf.py` (também anexa o `git log`).
- Quando o usuário for encerrar o dia (ou pedir para atualizar o PDF), use a skill `/encerrar-dia`: changelog
  (Adicionado/Alterado/Removido), backlog, capítulos afetados, PDF, conferência de segurança e commit se autorizado.
- Mudança de funcionalidade, stack ou estrutura de pastas atualiza o capítulo correspondente.
- Planejado: painel de desenvolvimento dentro do app (como o `/painel` do OnPath) com andamento, backlog, changelog,
  commits e documentos; não entra na versão publicada.

## Estado atual

Ainda não há código — a stack será discutida com o usuário. Não escolha tecnologia por conta própria; quando decidida,
registre na constituição (princípio VI) e atualize este arquivo com os comandos de build/lint/test.

Nome do app: **Térreo**. Os mockups usam "Condô" e "Edifício Aurora" — ignore esses nomes; o prédio piloto é o
**Edifício Taquaretinga**.

## Spec Kit

Fluxo: `/speckit-specify` → (`/speckit-clarify`) → `/speckit-plan` → `/speckit-tasks` → (`/speckit-analyze`) →
`/speckit-implement`. Cada mudança relevante vira `specs/NNN-nome/` (numeração sequencial). `spec.md` = o quê e por quê,
sem tecnologia; `plan.md` = como, com "Verificação da constituição". Scripts e modelos ficam em `.specify/`; as skills
em `.claude/skills/speckit-*`.

## Material de referência (só local, não versionado)

- `arquivos-gerais-terreo/minimundo-terreo.md` — **fonte das regras de negócio**. Use como entrada do
  `/speckit-specify`.
- `arquivos-gerais-terreo/terreo_telas/` — mockups: `pranchas_{1_morador,2_portaria,3_sindico}.png` e telas
  individuais `telas/NN_nome.png` (01–29 morador, 30–35 portaria, 36–42 síndico).
- `arquivos-gerais-terreo/terreo-kit/terreo-kit/` — kit da marca (cor `#1B4FD8` + branco, fonte Plus Jakarta Sans) e
  `LEIA-ME.md` com instruções de ícones/manifest de PWA para Next.js (Next.js ainda não é decisão tomada).
- Arquivos `*:Zone.Identifier` são lixo do WSL; ignore.

## Conceitos de domínio que atravessam o sistema

- **Três perfis** com interfaces distintas: morador, portaria e síndico. A UI da portaria é mínima (botões grandes,
  ícones, registro por voz).
- **Unidade = apartamento.** Síndico cadastra apartamento + responsável; só o responsável convida/remove moradores.
  Enquetes oficiais: um voto por apartamento.
- **Login sem senha**: celular → código pelo WhatsApp; sessão persistente, novo código ao trocar de aparelho ou após
  ~6 meses sem uso.
- **WhatsApp é canal de primeira classe**: avisos gerais no grupo, pessoais no privado; moradores confirmam leitura e
  cadastram códigos de entrega por mensagem. A camada de notificação despacha para push + WhatsApp conforme o tipo e as
  preferências do morador — exceto emergências, que chegam a todos.
- **Privacidade**: sem CPF/nascimento/documento de visitante; entregas e códigos nunca no grupo; aviso de barulho
  anônimo.
- **Fluxos encadeados**: sugestão aprovada vira melhoria e notifica quem deu "gostei"; mudança aprovada reserva o
  elevador e avisa vizinhos; aviso agendável e marcável como resolvido.
- **Plantão automático** pela escala (porteiros 6–14h, 14–22h, 22–6h, folgas em rodízio — regras ainda em aberto).
- "Ideias para o futuro" do minimundo estão fora do escopo inicial.
