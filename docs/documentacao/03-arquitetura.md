# Arquitetura e estrutura

## Stack

A stack técnica **ainda está em definição**. Quando for decidida, esta seção descreve cada camada (interface, API,
banco, notificações, WhatsApp) e como elas se ligam.

Decisões já tomadas:

- O app é um **PWA**: abre pelo navegador do celular e pode ser instalado na tela inicial.
- Identidade visual: azul `#1B4FD8` com branco, fonte Plus Jakarta Sans.
- O WhatsApp do condomínio terá número próprio, usado apenas para envios automáticos e para receber códigos de
  entrega.

## Onde está cada coisa

| Caminho | Conteúdo |
|---|---|
| `README.md` | Apresentação rápida do projeto. |
| `CLAUDE.md` | Orientações para o Claude Code trabalhar no repositório. |
| `docs/documentacao/` | Fonte desta documentação, em Markdown, um arquivo por capítulo. |
| `docs/backlog.md` | Plano de desenvolvimento: etapas e o que falta fazer. |
| `docs/changelog.md` | Histórico do que foi adicionado, alterado e removido, por data. |
| `docs/pdf/terreo-documentacao.pdf` | Documentação completa em PDF, gerada a partir dos arquivos acima. |
| `docs/assets/` | Imagens usadas na documentação. |
| `scripts/gerar_pdf.py` | Gera o PDF da documentação. |
| `specs/NNN-nome/` | Especificação, plano e tarefas de cada funcionalidade (Spec Kit). |
| `.specify/` | Configuração, modelos e constituição do Spec Kit. |
| `.claude/skills/` | Comandos do Claude Code (`/speckit-*` e `/encerrar-dia`). |

Esta tabela é atualizada sempre que uma pasta nova surgir (por exemplo, o código da interface e da API).
