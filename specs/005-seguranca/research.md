# Pesquisa: Segurança

Decisões técnicas da spec 005. Base: specs 001 a 004 (serviços sobre IndexedDB, `ServiceContext.actor`, matriz de
permissões, `notify`, `runDue`, `staff.board`, `whatsappInbox`, `DictateButton`).

## R1. Alerta de apartamento e alerta geral: duas entidades

- **Decisão**: `EmergencyAlert` (de um apartamento: em aberto → atendido → resolvido; ou cancelado) e `GeneralAlert`
  (do prédio: em aberto → encerrado). Comportamentos, público e permissões são diferentes; misturar só complicaria.

## R2. "Na hora" sem servidor

- **Decisão**: um componente `EmergencyWatcher`, montado no `ProfileShell` de todos os perfis, consulta a cada 3 s:
  - portaria: alertas de apartamento em aberto → **tela cheia** por cima de tudo, com som e vibração
    (`navigator.vibrate`, `AudioContext` com bipes curtos) quando o aparelho deixar;
  - todos: alerta geral em aberto ainda não visto por mim → **tela cheia**; depois de "Entendi", faixa no topo.
- **Etapa 3**: push (Web Push) e atualização em tempo real substituem a consulta; o componente continua o mesmo.
- **Por quê**: a demonstração roda num aparelho só (dados locais); a consulta curta é simples e testável.

## R3. Canais (amplia o `notify`)

- `emergency` (já existe) continua ignorando preferências e indo ao app e ao privado.
- Novo tipo `general-alert` (e `general-alert-closed`): ignora preferências, vai ao app e ao **privado de todos** e
  **uma** mensagem ao **grupo** — a única exceção à regra "geral só no grupo" (RF-019).
- Tipos `emergency-update` (atendido, cancelado, resolvido) para o apartamento.
- Contato de emergência (pessoa de fora, sem cadastro): mensagem direta na caixa de saída `private` para o celular do
  contato, fora do `notify` (não tem pessoa nem preferências).

## R4. Quem recebe o alerta de apartamento

- Tela cheia: porteiros com turno agora (`staff.board`); sem ninguém na escala, todos os porteiros.
- Notificação `emergency`: todos os porteiros, os síndicos e as outras pessoas ativas do apartamento.
- WhatsApp ao contato de emergência do apartamento (esclarecimento 1).
- Repetição: sem "Estou indo" em 2 minutos, o `runDue` marca `repeatedAt`, avisa de novo porteiros e síndicos
  (`emergency`) e a tela cheia volta a tocar.

## R5. Segurar 3 segundos

- **Decisão**: `HoldButton` com `pointerdown`/`pointerup`/`pointerleave` e um anel de progresso; teclado (Espaço ou
  Enter seguro) também funciona; soltar antes cancela. O tempo vem de uma constante (3.000 ms) que os testes e2e
  respeitam (`page.mouse.down` + espera).

## R6. SOS pelo WhatsApp

- `whatsappInbox.receive` confere primeiro se a mensagem tem "sos" ou "socorro" (sem acento e maiúsculas, palavra
  inteira); se sim e o celular é de uma pessoa ativa de um apartamento, cria o alerta (tipo `unknown`) e responde.
  Senão, segue para o reconhecimento de código de entrega (spec 004).

## R7. Contatos

- **Decisão**: `Contact` só para os cadastrados à mão pelo síndico (portaria, emergência e serviços); síndico e
  porteiro-chefe vêm do cadastro na leitura, com o celular só se `Person.showPhoneInContacts` estiver ligado
  (esclarecimento 2). O número da portaria é um `Contact` do grupo "do prédio", marcado como `frontDesk`, usado também
  no "Ligar para a portaria" da emergência.
- Ligar: `tel:+55…`; WhatsApp: `https://wa.me/55…` (só para celulares).

## R8. Permissões novas

| Ação | Responsável | Outro morador | Portaria | Síndico |
|---|---|---|---|---|
| Pedir ajuda (alerta do próprio apto) | ✔ | ✔ | ✘ | ✘ (como morador) |
| Cancelar alerta do próprio apto | ✔ (qualquer do apto) | só o que pediu | ✘ | ✘ |
| Ver alertas do próprio apto | ✔ | ✔ | — | — |
| Ver todos os alertas, "Estou indo", "Resolvido" | ✘ | ✘ | ✔ | ver ✔ / atender ✘ |
| Enviar alerta geral | ✘ | ✘ | ✔ | ✔ |
| Encerrar alerta geral | ✘ | ✘ | só o que enviou | ✔ |
| Ver alerta geral, contatos | ✔ | ✔ | ✔ | ✔ |
| Manter contatos | ✘ | ✘ | ✘ | ✔ |
| "Mostrar meu celular nos contatos" | — | — | porteiro-chefe | ✔ |

## R9. Dados de exemplo v5

- `SEED_VERSION = 5`: contatos (portaria, SAMU 192, Bombeiros 193, Polícia Militar 190, Defesa Civil 199, Light
  0800 021 0196, Naturgy 0800 024 0197, Águas do Rio 0800 195 0195 — **a conferir com o síndico**), um alerta de
  apartamento resolvido (há 3 dias, atendido em 1 min) e um alerta geral encerrado (há 10 dias).
