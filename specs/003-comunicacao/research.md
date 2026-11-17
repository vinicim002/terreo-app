# Pesquisa: Comunicação

Decisões técnicas da spec 003. Base: specs 001 e 002 (serviços tipados sobre IndexedDB, `ServiceContext.actor`,
matriz de permissões em `web/src/services/permissions.ts`, caixa de saída simulada, relógio injetável nos testes).

## R1. Tarefas com horário sem servidor: "conferir ao abrir"

- **Decisão**: uma função `runDue(deps)` aplica, de forma idempotente, tudo o que já deveria ter acontecido até
  `deps.now()`:
  - publicar avisos agendados (`publishAt ≤ agora` e ainda não publicados);
  - lembretes da véspera de avisos e reuniões (marca `reminderSentAt` para não repetir);
  - encerrar enquetes vencidas (`closesAt ≤ agora` → `closedAt`).
  É chamada no início das leituras de avisos, enquetes, agenda e notificações, e ao abrir o app. Cada ação gera as
  mesmas notificações e mensagens que geraria na hora.
- **Por quê**: o app não tem servidor nem processo em segundo plano nesta etapa (premissa da spec). Com o relógio
  injetado (`deps.now`), os testes controlam exatamente quando cada coisa acontece (CS-007). Na Etapa 3, a mesma lógica
  vira tarefa agendada do ARQ.
- **Alternativas**: `setTimeout` no navegador — perderia tudo com o app fechado e não é testável com relógio simulado.

## R2. Despacho de notificações

- **Decisão**: um único `notify(deps, envio)` recebe tipo, público, título, texto, destino e se vai ao grupo. Ele:
  1. calcula o público (moradores ativos; a portaria só para avisos);
  2. filtra pelas preferências no app de cada pessoa (emergência ignora preferências — RF-025);
  3. grava uma `Notification` por pessoa;
  4. se for assunto geral marcado para o grupo, grava **uma** mensagem `group` na caixa de saída; se for pessoal e a
     pessoa deixou ligado, grava uma mensagem `private` para ela (RF-026).
- **Caixa de saída**: o tipo das mensagens passa de `otp | invite` para `otp | invite | group | private`; mensagens
  `group` têm `toPhone` nulo e `condominiumId`.
- **Por quê**: um ponto só garante as regras de canal (grupo × privado × preferências) e vira, na Etapa 3, a entrada da
  fila de envios (constituição: envios sempre pela fila).

## R3. Leitura e confirmação de avisos, com edição

- **Decisão**: `NoticeRead { noticeId, personId, version, readAt, confirmedAt }`. O aviso tem `version`, que sobe a cada
  edição; só contam as leituras da versão atual. Assim "zerar leituras ao editar" (esclarecimento 3) não apaga o
  histórico.
- **"Lido por N de M"**: M = apartamentos com pelo menos uma pessoa ativa; N = desses, os que têm leitura da versão
  atual de qualquer pessoa ativa. Confirmações são listadas por pessoa e agrupadas por apartamento.

## R4. Enquetes oficiais com sugestão

- **Decisão**: `PollVote { pollId, optionId, personId, apartmentId? }` — nas oficiais, a chave é o apartamento e só o
  responsável grava; nas comuns, a chave é a pessoa. `PollSuggestion { pollId, optionId, personId, apartmentId }`
  (oficiais, pessoas com permissão que não são responsáveis). Resultado calculado na leitura (sem contadores guardados).
- **Visibilidade**: sugestões só aparecem para o responsável do mesmo apartamento; o resultado parcial só se a enquete
  permitir; a portaria não vê enquetes.

## R5. Agenda e repetição

- **Decisão**: `AgendaEvent { title, kind: maintenance | routine, startsAt, durationMinutes?, recurrence }` com
  `recurrence: none | weekly | monthly | semiannual | yearly`. A agenda de um mês expande as ocorrências no intervalo,
  junta reuniões e avisos com data de referência, e ordena. Dia inexistente no mês (31 em mês de 30) cai no último dia.
- **Fuso**: datas guardadas em UTC e mostradas no fuso de Brasília, com os utilitários de `web/src/i18n/datetime.ts`
  ampliados (início/fim do dia e do mês em Brasília via `Intl`, sem biblioteca nova).

## R6. Permissões novas (matriz da spec 002 ampliada)

| Ação | Morador | Portaria | Síndico |
|---|---|---|---|
| Ler avisos e agenda, confirmar leitura | ✔ | ✔ (ler; não confirma) | ✔ |
| Criar, editar, agendar, apagar, resolver aviso | ✘ | ✘ | ✔ |
| Ver enquetes | ✔ | ✘ | ✔ |
| Votar em enquete comum | com permissão | ✘ | ✘ |
| Votar em enquete oficial | só o responsável | ✘ | ✘ |
| Sugerir em enquete oficial | com permissão, não responsável | ✘ | ✘ |
| Criar e encerrar enquete | ✘ | ✘ | ✔ |
| Cadastrar reunião, resumo, evento da agenda | ✘ | ✘ | ✔ |
| Próprias notificações e preferências | ✔ | ✔ | ✔ |

O síndico vota como morador quando entra com o papel de morador (spec 002, mais de um papel).

## R7. Sino e contagem

- **Decisão**: hook `useUnreadCount()` (TanStack Query) que roda `runDue` e conta as não lidas; recarrega a cada 30 s
  e depois de qualquer mutação. O sino mostra o número até "9+", com rótulo acessível ("3 notificações não lidas").

## R8. Dados de exemplo v3

- **Decisão**: `SEED_VERSION = 3`. `buildSeed(now)` passa a receber a data de referência, para os avisos, enquetes e
  reuniões ficarem sempre "recentes" (ontem, amanhã, daqui a 5 dias) em relação ao dia em que os dados são criados.
  Conteúdo conforme RF-030.
