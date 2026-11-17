# Quickstart: validar Portaria

Roteiro para provar que a spec 004 está pronta. Cenários da `spec.md`; detalhes em `contracts/` e `data-model.md`.

## Ambiente

```bash
docker compose up --build -d --renew-anon-volumes   # ou make dev
```

App em http://localhost:3100. Para começar do zero: `/dev` → "Restaurar dados de exemplo" (dados v4). Mensagens do
WhatsApp (enviadas e recebidas) ficam no painel `/dev`.

## Verificações automáticas

```bash
cd web && npx vitest run
docker compose --profile e2e run --rm e2e npx playwright test --grep-invert @build
```

Cobrem: matriz de permissões da spec 004 (CS-005), estados das entregas, quem é avisado (esclarecimento 1) e nunca no
grupo (CS-004), lembrete de 3 dias com relógio controlado, código que não chegou, visitante que não veio, modo viagem,
reconhecimento das mensagens do WhatsApp (CS-006), equipe de plantão com a virada da meia-noite (CS-007), ditar com
reconhecimento simulado, e os fluxos das 6 histórias nos dois celulares.

## Cenários manuais

| # | Passos | Esperado | Spec |
|---|---|---|---|
| 1 | Morador do 804 → Entregas → Cadastrar código (iFood, 4821, subir pelo elevador) | Em "Aguardando" em menos de 30 s | H1-1, CS-001 |
| 2 | `/dev` → Simular mensagem do celular do familiar: "Mercado Livre MLB-99" | Resposta de confirmação; código no 804 | H1-3 |
| 3 | Portaria → buscar 804 | Códigos em letras grandes em 2 toques | H1-4, CS-002 |
| 4 | Portaria → "Chegou" no iFood | Entregue; aviso no privado de quem cadastrou e do responsável; nada no grupo | H1-5, CS-004 |
| 5 | Portaria → Receber encomenda (foto, 804, média, Amazon) | Na portaria; aviso a todos do 804 com foto | H2-1, H2-2, CS-003 |
| 6 | Morador → "Retirei" | Retirada com nome e hora | H2-3 |
| 7 | Portaria → Correspondência no 502 | Aviso simples ao 502 | H2-6 |
| 8 | Morador → Avisar visitante (Mariana, hoje 19h–21h, 2) | Em Esperados da portaria | H3-1, H3-2 |
| 9 | Portaria → "Chegou" | Hora e quem liberou; aviso ao morador | H3-3 |
| 10 | Portaria → prestador | "Interfone antes de liberar" | H3-4 |
| 11 | Portaria → Visitante sem cadastro | No histórico do apto com a marca | H3-5 |
| 12 | Portaria → Ditar recado (microfone) → Enviar | Síndico recebe; "Transformar em aviso" preenche o texto | H4 |
| 13 | Celular sem suporte a ditar | Aviso e campo digitável | H4-3 |
| 14 | Morador → Modo viagem (5 dias) | Portaria vê "Em viagem até" | H5-1 |
| 15 | Equipe de plantão | Porteiro e limpeza do turno atual; próximos turnos | H5-4 |
| 16 | Portaria → Registrar achado com foto e descrição falada | Aparece em Achados para os moradores | H6-1 |
| 17 | Morador → "É meu" → Portaria → Devolvido | Vai para Devolvidos | H6-2, H6-3 |
| 18 | Trocar idioma | Telas novas em inglês e espanhol | RF-025 |
