# Pesquisa: Participação

Decisões técnicas da spec 006. Base: specs 001 a 005 (serviços sobre IndexedDB, `ServiceContext.actor`, matriz de
permissões, `notify`, fotos reduzidas no aparelho, `DictateButton`, `dialable.ts`).

## R1. Votos e indicações em lojas próprias

- **Decisão**: `SuggestionVote` (sugestão, pessoa, `up|down`), `IssueSupport` (problema, pessoa) e `Recommendation`
  (prestador ou comércio, pessoa, nota, comentário) em lojas separadas, com índice por item. Contagens e médias são
  calculadas na leitura.
- **Por quê**: um voto por pessoa é garantido pela chave (item, pessoa) e o "desfazer" é apagar; não há contador que
  possa ficar errado. Na Etapa 3, viram tabelas com restrição única.

## R2. Sugestão aprovada → melhoria

- **Decisão**: `suggestions.setStatus(…, "approved")` cria um `Improvement` "planned" com `suggestionId` e grava
  `improvementId` na sugestão, na mesma operação; avisa os "gostei" (`suggestion-approved`). Apagar a melhoria volta a
  sugestão para "reviewing" (caso-limite). Concluir melhoria com origem avisa os "gostei" (`improvement-done`).
- **Idempotente**: aprovar de novo não cria outra melhoria.

## R3. Barulho anônimo de verdade

- **Decisão**: `NoiseReport` **não tem campo de autor**. O serviço confere a permissão pelo ator (morador ativo) e
  descarta a identidade antes de gravar. "Meus avisos" e os 30 minutos entre avisos ficam só no aparelho do morador
  (`localStorage`, chave por pessoa, com os ids dos próprios avisos), nunca no registro.
- **Notificação ao síndico**: `noise` sem alvo identificável, título "Aviso de barulho", corpo com tipo, onde e hora.
- **Teste (CS-004)**: o registro gravado não contém `personId`, apartamento, telefone nem nome; nenhuma visão do
  síndico expõe; a notificação também não.
- **Etapa 3**: o servidor guarda só um contador de frequência com hash da pessoa e do dia, sem ligar ao aviso.

## R4. Problemas: visibilidade e histórico

- `Issue` com `public` (só morador escolhe); em público, a origem aparece como "Morador" para os vizinhos e com o
  apartamento só para o síndico e a própria casa (como nas sugestões, princípio III); privado é visível ao autor, às pessoas do apartamento e ao síndico; a
  portaria vê os que ela mesma avisou e os públicos. `updates: {status, message, at}[]` dentro do registro (no máximo
  algumas dezenas por problema).
- "Antes de enviar, mostrar abertos do mesmo lugar": `issues.similar(ctx, place)` devolve os públicos abertos daquele
  lugar.
- Fotos: até 3, `resizePhoto` com `{ max: 1024, quality: 0.7 }` (como a portaria).

## R5. Prestadores e comércios numa entidade

- **Decisão**: `Listing` com `kind: provider|shop`, `category` (serviço ou tipo), telefone normalizado por
  `normalizeDialable` (spec 005; único por condomínio e `kind`), `delivers` (comércio). Indicações em
  `Recommendation` com `rating` (1–5, só prestador) e `role` de quem indicou (apartamento, portaria, síndico —
  esclarecimento 2). Um item sem indicações (todas retiradas) some da lista; o síndico remove avisando quem indicou.

## R6. Pesquisa por trimestre

- Período = trimestre do calendário em Brasília (`2026-Q4`). `SurveyResponse` por (período, pessoa), editável até o
  fim do trimestre. Visão do síndico: contagem, médias com uma casa, diferença para o trimestre anterior e
  comentários sem identificação.

## R7. Notificações

- Tipos novos: `suggestion-status` (para quem sugeriu), `suggestion-approved` e `improvement-done` (para os "gostei"),
  `issue-new` e `noise` (para o síndico), `issue-update` (autor e apoiadores), `listing-removed` (quem indicou).
- Canais (RF-023): `suggestion-status` e `issue-update` aparecem no app conforme a preferência "Avisos" (spec 003), sem
  WhatsApp nesta etapa; os demais ficam **só no app**, sempre (`APP_ONLY`). Nada vai ao grupo. Respostas pelo WhatsApp
  privado ficam para a Etapa 3, junto com uma preferência própria.

## R8. Permissões novas

| Ação | Morador | Portaria | Síndico |
|---|---|---|---|
| Ver sugestões | ✔ | ✘ | ✔ |
| Publicar, votar, editar/apagar a própria (Recebida) | ✔ | ✘ | ✘ |
| Mudar situação de sugestão, responder | ✘ | ✘ | ✔ |
| Ver melhorias | ✔ | ✔ | ✔ |
| Gerir melhorias | ✘ | ✘ | ✔ |
| Avisar problema | ✔ | ✔ | ✘ |
| Apoiar problema público | ✔ | ✘ | ✘ |
| Ver todos os problemas, atualizar, urgente | ✘ | ✘ | ✔ |
| Avisar barulho | ✔ | ✘ | ✘ |
| Ver avisos de barulho | ✘ | ✘ | ✔ |
| Ver e indicar prestadores e comércios | ✔ | ✔ | ✔ |
| Remover prestador ou comércio | ✘ | ✘ | ✔ |
| Responder pesquisa | ✔ | ✘ | ✘ |
| Ver resultados da pesquisa | ✘ | ✘ | ✔ |

## R9. Dados de exemplo v6

- `SEED_VERSION = 6`, banco v6, relativos a `now`: 5 sugestões (recebida, em análise, aprovada → melhoria, não será
  feita, uma "sem mostrar apto") com votos; 3 melhorias (concluída com fotos de antes e depois e valor, em andamento
  60%, planejada vinda da sugestão); 3 problemas (aberto novo, aberto urgente com apoios, resolvido com histórico);
  2 avisos de barulho; 4 prestadores e 3 comércios com indicações; respostas da pesquisa no trimestre anterior.
- Fotos de exemplo: reaproveitar a imagem embutida da spec 004 e duas pequenas em data URL.
