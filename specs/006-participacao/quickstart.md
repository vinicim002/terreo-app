# Quickstart: validar Participação

Cenários da `spec.md`; detalhes em `contracts/` e `data-model.md`. Ambiente: `docker compose up --build -d
--renew-anon-volumes`, http://localhost:3100, `/dev` → "Restaurar dados de exemplo" (v6).

## Verificações automáticas

```bash
cd web && npx vitest run
docker compose --profile e2e run --rm e2e npx playwright test --grep-invert @build
```

Cobrem: matriz de permissões da spec 006 (CS-006); um voto por pessoa e percentual; aprovar cria melhoria e avisa os
"gostei" (CS-002); visibilidade de problema público e privado, apoio e histórico; barulho sem autor em registro,
visões e notificações (CS-004); indicação única por pessoa, média e telefone repetido; pesquisa uma vez por trimestre
e médias com diferença.

## Cenários manuais

| # | Passos | Esperado | Spec |
|---|---|---|---|
| 1 | 804 → Sugestões → "+" → publicar sem mostrar apto | Aparece como "Morador · agora", "Recebida" | H1-1 |
| 2 | Familiar → "gostei"; de novo | Conta e depois tira | H1-2 |
| 3 | Síndico → aprova com resposta | Vira melhoria planejada; quem gostou é avisado; o síndico vê o apto | H1-4, H1-5 |
| 4 | 804 → Avisar problema → elevador, quebrado, foto, mostrar para todos | Síndico recebe "Novo" | H2-1 |
| 5 | Escolher "Barulho" no problema | Explicação e atalho para o aviso anônimo | Esclarecimento 1 |
| 6 | Familiar → apoiar; síndico → em andamento com mensagem | Os dois são avisados | H2-2, H2-3 |
| 7 | 804 → Aviso de barulho; síndico abre | Sem nome nem apartamento | H3, CS-004 |
| 8 | Segundo aviso em seguida | Pede para esperar 30 min | H3-3 |
| 9 | Portaria → Prestadores → indicar; morador → "Também indico" | "2 indicam", média, "Portaria" na indicação | H4, Esclarecimento 2 |
| 10 | Indicar com telefone repetido | Leva ao existente | H4-7 |
| 11 | 804 → Pesquisa → 5, 4, 5 | Síndico vê médias e comentário | H5 |
| 12 | Síndico → Melhorias → concluir com fotos e valor | Morador vê antes e depois | H6 |
| 13 | Trocar idioma | Telas novas em inglês e espanhol | RF-024 |
