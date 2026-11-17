# Quickstart: validar Comunicação

Roteiro para provar que a spec 003 está pronta. Cenários da `spec.md`; detalhes em `contracts/` e `data-model.md`.

## Ambiente

```bash
docker compose up --build -d --renew-anon-volumes   # ou make dev
```

App em http://localhost:3100. Para começar do zero: `/dev` → "Restaurar dados de exemplo" (dados v3, com avisos,
enquetes, reuniões e eventos relativos à data de hoje). Mensagens do grupo e do privado aparecem no painel `/dev`.

## Verificações automáticas

```bash
cd web && npx vitest run
docker compose --profile e2e run --rm e2e npx playwright test --grep-invert @build
```

Cobrem: matriz de permissões da spec 003 (CS-004), `runDue` com relógio controlado (publicação agendada, véspera,
encerramento — CS-007), contagem "Lido por N de M" (CS-005), versões após edição, enquete oficial (só o responsável vota,
sugestões), comum (voto por pessoa com permissão), canais e preferências (CS-006), recorrência da agenda, e os fluxos de
tela das 5 histórias nos dois celulares.

## Cenários manuais

| # | Passos | Esperado | Spec |
|---|---|---|---|
| 1 | Síndica → Avisos → Novo aviso (água, importante, confirmação, grupo) → Publicar | Aviso no topo; mensagem do grupo no `/dev` | H1-1, H1-2 |
| 2 | Morador do 804 → sino | Contador aumentou; notificação "Novo aviso do síndico" | H1-3, H5-1 |
| 3 | Avisos → "Não lidos (N)" → abrir | Passa a lido; "Confirmar leitura" → "Lido ✓" | H1-4, H2-1 |
| 4 | Síndica abre o aviso | "Lido por N de M apartamentos" e a lista de confirmações | H2-2 |
| 5 | Síndica agenda aviso para daqui a 2 min | Em "Agendados"; morador não vê; depois do horário, aparece | H2-3, CS-007 |
| 6 | Síndica edita o aviso publicado | "Editado às HH:MM", volta a não lido, mensagem de correção no grupo | RF-007a |
| 7 | Síndica marca como resolvido com nota | "Resolvido" + notificação nos moradores | H2-6 |
| 8 | Portaria → Mais → Avisos | Lê, sem "Confirmar leitura"; não vê Enquetes | RF-001, RF-016 |
| 9 | Familiar do 804 (com permissão) → enquete oficial | "Sugerir ao responsável" | H3-5 |
| 10 | Responsável do 804 → mesma enquete | Vê a sugestão; vota; "Mudar voto" | H3-2 a H3-4 |
| 11 | Síndica encerra a enquete | Vai para "Encerradas" com a vencedora | H3-8 |
| 12 | Agenda do mês | Marcas nos dias; "Próximos" com reunião, coleta seletiva, caixa d'água | H4-1, H4-2 |
| 13 | Síndica cadastra reunião daqui a 5 dias | Notificação nos moradores; aparece na agenda | H4-3 |
| 14 | Síndica registra o resumo da reunião passada | "Resumo disponível"; notificação | H4-4 |
| 15 | Central → "Ler todas" | Sino zera | H5-4 |
| 16 | "Como receber" → desligar Enquetes no app → nova enquete | Sem notificação no app; mensagem no grupo continua | H5-5, RF-026 |
| 17 | "Como receber" | Emergência aparece "Sempre ativa"; avisos/reuniões/enquetes mostram "Pelo grupo do condomínio" | RF-025, H5-5 |
| 18 | Trocar idioma | Telas novas em inglês e espanhol | RF-029 |
