# Quickstart: validar Segurança

Cenários da `spec.md`; detalhes em `contracts/` e `data-model.md`. Ambiente: `docker compose up --build -d
--renew-anon-volumes`, http://localhost:3100, `/dev` → "Restaurar dados de exemplo" (v5).

## Verificações automáticas

```bash
cd web && npx vitest run
docker compose --profile e2e run --rm e2e npx playwright test --grep-invert @build
```

Cobrem: matriz de permissões da spec 005 (CS-006); alerta só depois de 3 s segurando (CS-002); um em aberto por
apartamento; quem recebe (portaria de plantão em tela cheia, demais porteiros, síndico, casa, contato de emergência);
repetição após 2 min com relógio controlado; alerta geral no app, no grupo e no privado de todos com as preferências
desligadas (CS-003); SOS pelo WhatsApp (CS-006a); contatos com busca e celular só com autorização.

## Cenários manuais

| # | Passos | Esperado | Spec |
|---|---|---|---|
| 1 | 804 → Emergência → tocar rápido no botão | Nada é enviado | H1-1, CS-002 |
| 2 | Segurar 3 s com "Saúde" | "Alerta enviado às HH:MM" | H1-2 |
| 3 | Portaria (outra aba, mesma conta do aparelho) | Tela cheia "Apto 804 · 8º andar · Saúde", contato de emergência | H1-3, H1-4, CS-001 |
| 4 | "Estou indo" | Morador vê "Jonas viu o alerta e está a caminho" | H1-5, CS-004 |
| 5 | `/dev` → caixa de saída | Mensagem ao contato de emergência, privado da casa | Esclarecimento 1 |
| 6 | "Resolvido" com nota | Vai para o histórico | H1-7, H4 |
| 7 | Morador cancela outro alerta | Portaria vê "Cancelado pelo morador" | H1-6 |
| 8 | `/dev` → mensagem "socorro" do celular do familiar | Alerta criado e resposta no privado | Esclarecimento 3 |
| 9 | Portaria → Alerta geral (incêndio, ditar) → confirmar | Tela cheia em todos; grupo e privado no `/dev` | H2 |
| 10 | Morador → "Entendi" | Fecha; faixa no início | H2-4 |
| 11 | Portaria → Encerrar | "Alerta encerrado" para todos | H2-5 |
| 12 | Início → atalho Contatos → buscar "luz" → ligar | Light com `tel:` | H3, CS-005 |
| 13 | Síndico → Editar contatos → acrescentar "Chaveiro 24h" | Aparece para todos | H3-4 |
| 14 | Síndico → Perfil → "Mostrar meu celular" | Celular aparece nos contatos | Esclarecimento 2 |
| 15 | Trocar idioma | Telas novas em inglês e espanhol | RF-021 |
