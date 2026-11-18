# Contrato: rotas (acréscimos da spec 005)

| Rota | Tela |
|---|---|
| `/resident/emergency/` | Emergência (mockup 12): segurar 3 s, tipo, ligar direto; com alerta em aberto, a tela de acompanhamento (mockup 13): "Alerta enviado", quem viu, ligar para a portaria e o SAMU, "Cancelar alerta" |
| `/resident/contacts/` · `/front-desk/contacts/` · `/manager/contacts/` | Contatos (mockup 15) com busca; o síndico tem "Editar contatos" |
| `/manager/contacts/edit/` | Contatos de emergência e serviços: acrescentar, editar, reordenar, remover; número da portaria |
| `/front-desk/general-alert/` · `/manager/general-alert/` | Alerta geral: tipo, mensagem (ditar), mensagens prontas, confirmação; com um em aberto, "Encerrar" |
| `/front-desk/emergency-alert/` · `/manager/emergency-alert/` | Alertas de emergência: em aberto e histórico (90 dias), apartamento e gerais |

**Em todos os perfis** (`EmergencyWatcher` no `ProfileShell`): tela cheia do alerta de apartamento na portaria
(mockup 34: "Estou indo", interfone, SAMU, contato de emergência) e tela cheia do alerta geral para todos ("Entendi");
faixa do alerta geral em aberto no topo do início. No perfil (síndico e porteiro-chefe): "Mostrar meu celular nos
contatos".
