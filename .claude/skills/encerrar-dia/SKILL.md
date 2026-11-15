---
name: encerrar-dia
description: Encerra o dia de trabalho no Térreo — atualiza changelog, backlog e documentação, gera o PDF e prepara o commit. Use quando o desenvolvedor disser que vai parar, encerrar o dia ou pedir para atualizar o PDF da documentação.
---

# Encerrar o dia

Siga em ordem. Escreva tudo em português, com acentuação correta.

1. **Levantar o que mudou no dia**: `git log --since=midnight --format='%h %s'`, `git status` e `git diff --stat`.
   Considere também o que foi feito nesta conversa e ainda não foi commitado.
2. **`docs/changelog.md`**: acrescente (ou complete) a entrada do dia no topo, `## AAAA-MM-DD`, com as subseções
   `### Adicionado`, `### Alterado` e `### Removido` (omita as vazias). Descreva o efeito para quem lê, não o arquivo.
3. **`docs/backlog.md`**: marque o que foi concluído, acrescente o que surgiu e ajuste as etapas.
4. **`docs/documentacao/`**: atualize os capítulos afetados — situação das funcionalidades (Planejada / Em construção /
   Pronta), stack e decisões de arquitetura, tabela "Onde está cada coisa", comandos de desenvolvimento. Capítulo novo
   = arquivo novo com prefixo numérico.
5. **Gerar o PDF**: `uv run scripts/gerar_pdf.py` (gera `docs/pdf/terreo-documentacao.pdf`). Se falhar, mostre o erro.
6. **Conferir segurança**: `git status`; nenhum `.env`, credencial, dado real de morador ou `arquivos-gerais-terreo/`
   pode estar na lista.
7. **Resumir** ao desenvolvedor o que entrou no changelog e perguntar se pode commitar e enviar. Ao commitar, use
   `docs: atualiza documentação do dia` (ou prefixo mais adequado), **sem** `Co-Authored-By` nem menção a IA.
