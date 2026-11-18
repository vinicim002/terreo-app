# Contrato: rotas (acréscimos da spec 006)

| Rota | Tela |
|---|---|
| `/resident/suggestions/` | Sugestões (mockup 10): abas Mais votadas, Recentes, Minhas; "+" |
| `/resident/suggestion/` (`?id=` detalhe, `/new/`, `?id=…&edit=1`) | Detalhe com resposta e votos; nova (mockup 11) |
| `/resident/improvements/` · `/front-desk/improvements/` · `/manager/improvements/` | Melhorias (mockup 24); o síndico tem "+" e editar |
| `/manager/improvement/edit/` | Criar e editar melhoria (situação, percentual, mês, valor, fotos) |
| `/manager/suggestions/` | Sugestões do síndico: filtro por situação, mudar situação com resposta |
| `/resident/report-issue/` · `/front-desk/report-issue/` | Avisar problema (mockup 18) e "Meus problemas" |
| `/manager/issues/` | Problemas (mockup 42): abas Abertos, Em andamento, Resolvidos; atualizar com mensagem, urgente |
| `/resident/noise-report/` | Aviso de barulho anônimo e "Meus avisos" |
| `/manager/noise-reports/` | Avisos de barulho, sem autor; marcar visto |
| `/resident/providers/` · `/front-desk/providers/` · `/manager/providers/` | Prestadores (mockup 20) |
| `/resident/local-shops/` · `/front-desk/local-shops/` · `/manager/local-shops/` | Comércio do bairro |
| `/resident/satisfaction-survey/` | Pesquisa do trimestre |
| `/manager/satisfaction/` | Resultados por trimestre |

**Catálogo** (`screens.ts`): a portaria ganha `improvements`, `report-issue`, `providers`, `local-shops` (cada uma com
página própria, como exige o teste da spec 005); o síndico ganha `providers`. **Início do morador**: lembrete da
pesquisa enquanto não respondeu no trimestre.
