# Terreo

App do condomínio: um lugar único onde **moradores**, **síndico** e **portaria** encontram tudo o que acontece no
prédio.

O Terreo funciona direto no celular, sem baixar nada da loja: basta abrir um link e adicionar o ícone à tela inicial
(PWA). Ele não substitui o WhatsApp do prédio, trabalha junto com ele: tudo o que é importante também chega pelo
WhatsApp do condomínio, para que ninguém fique de fora.

O primeiro prédio a usar o app, como projeto piloto, é o **Edifício Taquaretinga**.

## Para quem

| Perfil | O que faz no app |
|---|---|
| Morador | Acompanha avisos e reuniões, informa códigos de entrega, avisa visitas, envia sugestões e problemas, vota em enquetes |
| Portaria | Consulta códigos de entrega por apartamento, registra encomendas com foto, confirma visitantes, envia alertas — com telas simples e registro por voz |
| Síndico | Publica avisos, marca reuniões, responde sugestões, cadastra apartamentos e moradores, faz enquetes e presta contas |

## Principais funcionalidades

- **Avisos do prédio** com alerta no celular e envio automático ao grupo do WhatsApp, agendamento e confirmação de
  leitura.
- **Entregas e códigos**: o morador informa o código antes (pelo app ou pelo WhatsApp), o porteiro encontra pelo
  apartamento e registra a chegada com foto; o aviso vai no privado.
- **Visitantes e prestadores** avisados com antecedência.
- **Sugestões** públicas com votos; as aprovadas viram **melhorias** acompanhadas pelos moradores.
- **Calendário, reuniões do conselho, enquetes** (um voto por apartamento) e **prestação de contas**.
- **Botão de emergência** e **alerta geral** para todos os moradores.
- **Funcionários de plantão** calculados pela escala de turnos.
- **Achados e perdidos, contatos úteis, regras, mudanças e obras, prestadores indicados.**
- **Login sem senha**: código enviado pelo WhatsApp do condomínio.
- **Acessibilidade**: letras maiores, alto contraste, leitura em voz alta, legendas, Libras e modo escuro; português,
  inglês e espanhol.

## Princípios

- Guardar o mínimo de dados pessoais (sem CPF, data de nascimento ou documento de visitantes).
- Códigos e entregas de cada morador nunca aparecem no grupo.
- Fácil para qualquer pessoa, inclusive idosos e funcionários com pouca familiaridade com tecnologia.

Os princípios completos estão na constituição do projeto: [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Status

Em fase de especificação. A stack técnica ainda está sendo definida.

## Como o projeto é desenvolvido

O projeto usa o [Spec Kit](https://github.com/github/spec-kit) (desenvolvimento guiado por especificação) com o
Claude Code. Cada funcionalidade tem sua pasta em `specs/NNN-nome/` com `spec.md` (o quê e por quê), `plan.md` (como)
e `tasks.md` (ordem de execução).

Fluxo: `/speckit-specify` → `/speckit-clarify` (opcional) → `/speckit-plan` → `/speckit-tasks` →
`/speckit-analyze` (opcional) → `/speckit-implement`.

## Contribuindo

- Commits no formato `<prefixo em inglês>: <descrição em português>`, por exemplo
  `feat: adiciona cadastro de entregas` ou `fix: corrige horário do plantão`.
- O autor do commit é a pessoa que fez o trabalho. Não adicionar coautores de ferramentas de IA.
- Nunca versionar `.env`, senhas, chaves, credenciais ou dados reais de moradores.
