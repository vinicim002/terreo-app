# Desenvolvimento e manutenção

## Fluxo com o Spec Kit

Cada funcionalidade passa pelo [Spec Kit](https://github.com/github/spec-kit) e ganha uma pasta `specs/NNN-nome/`:

1. `/speckit-specify` — escreve o `spec.md`: o quê e por quê, sem tecnologia.
2. `/speckit-clarify` (opcional) — tira dúvidas da especificação.
3. `/speckit-plan` — escreve o `plan.md`: como construir, conferindo a constituição.
4. `/speckit-tasks` — escreve o `tasks.md`: a ordem de execução.
5. `/speckit-analyze` (opcional) — confere se spec, plano e tarefas estão coerentes.
6. `/speckit-implement` — executa as tarefas.

As regras que valem para todo o projeto estão na constituição, em `.specify/memory/constitution.md`.

## Commits

- Formato: `<prefixo em inglês>: <descrição em português>`, por exemplo `feat: adiciona cadastro de entregas`.
- Prefixos usuais: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`.
- O autor é a pessoa que fez o trabalho. Não se adicionam coautores de ferramentas de IA.

## Segurança do repositório

Nunca são versionados: arquivos `.env`, senhas, chaves, credenciais e dados reais de moradores. O `.gitignore` já
bloqueia esses arquivos; mesmo assim, o `git status` é conferido antes de cada commit.

## Encerramento do dia

Ao final de cada dia de trabalho, com o comando `/encerrar-dia` do Claude Code:

1. O `docs/changelog.md` recebe o que foi adicionado, alterado e removido no dia.
2. O `docs/backlog.md` é atualizado com o andamento das etapas.
3. Os capítulos de `docs/documentacao/` são atualizados se algo mudou (funcionalidades, arquitetura, estrutura).
4. O PDF é gerado de novo com `uv run scripts/gerar_pdf.py`.
5. Tudo é commitado e enviado, quando o desenvolvedor autorizar.

## Gerar o PDF manualmente

Requer o [uv](https://docs.astral.sh/uv/). As dependências (Markdown e WeasyPrint) são baixadas automaticamente.

```
uv run scripts/gerar_pdf.py
```

O resultado fica em `docs/pdf/terreo-documentacao.pdf`.

## Painel de desenvolvimento (planejado)

O app terá uma área só para desenvolvimento, nos moldes do painel do OnPath, que mostra o que é o projeto, o andamento
das etapas, o backlog, o histórico de alterações e de commits e os documentos de `docs/` e `specs/`, lidos direto dos
arquivos. Essa área não entra na versão publicada para os moradores. Ela será construída quando a stack estiver
definida (ver backlog).
