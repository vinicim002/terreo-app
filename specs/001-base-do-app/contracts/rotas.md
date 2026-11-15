# Contrato: rotas e telas

Rotas em inglês (constituição, princípio I); títulos vêm das traduções (`screens.<slug>.title`). Toda tela listada
existe nesta etapa como tela vazia "em construção" (RF-007), exceto as marcadas ✔ (com conteúdo nesta etapa).

## Gerais

| Rota | Tela | Modos |
|---|---|---|
| `/` | Escolha de perfil ✔ (`dev`, `demo`) · "Entrada em breve" ✔ (`real`) | todos |
| `/settings` | Idioma, tema, alto contraste, tamanho de letra, trocar perfil ✔ | todos |
| `/dev` e subpáginas | Painel de desenvolvimento ✔ (`contracts/painel-dev.md`) | só `dev` |
| qualquer outra | "Página não existe" ✔ com botão para o início | todos |

Telas comuns a todos os perfis, dentro de cada prefixo: `notifications` (sino), `accessibility` (atalho ✔ — leva às
mesmas opções de `/settings`).

## Morador — prefixo `/resident`

Barra de baixo: **Início** `/resident` · **Entregas** `/resident/deliveries` · **Sugestões** `/resident/suggestions` ·
**Perfil** `/resident/profile`. "Todos os serviços": `/resident/services` ✔ (lista agrupada abaixo).

| Grupo | Telas (`/resident/<slug>`) |
|---|---|
| Comunicação | `notices`, `polls`, `calendar`, `meetings`, `suggestions` |
| Portaria | `deliveries`, `visitors`, `on-duty`, `lost-and-found`, `travel-mode` |
| Prédio | `report-issue`, `moves`, `improvements`, `finances`, `key-request`, `noise-report`, `warnings`, `listings` |
| Úteis | `contacts`, `providers`, `local-shops`, `rules`, `faq`, `satisfaction-survey`, `accessibility` |
| Outras | `emergency`, `invite`, `welcome` |

## Portaria — prefixo `/front-desk`

Barra de baixo: **Portaria** `/front-desk` · **Entregas** `/front-desk/deliveries` · **Visitantes**
`/front-desk/visitors` · **Mais** `/front-desk/more` ✔.

Em "Mais": `receive-delivery`, `mail`, `dictate`, `general-alert`, `emergency-alert`, `lost-and-found`, `on-duty`,
`travel-watch`, `contacts`. Botões de ação da portaria com no mínimo 56 × 56 px.

## Síndico — prefixo `/manager`

Barra de baixo: **Painel** `/manager` · **Avisos** `/manager/notices` · **Moradores** `/manager/residents` · **Mais**
`/manager/more` ✔.

Em "Mais": `polls`, `schedule`, `finances`, `issues`, `suggestions`, `improvements`, `meetings`, `calendar`, `moves`,
`key-requests`, `warnings`, `noise-reports`, `monthly-report`, `reminders`, `faq`, `rules`, `contacts`, `listings`,
`satisfaction`, `general-alert`.

## Regras de navegação

1. Em `dev`/`demo`, sem perfil escolhido, qualquer rota de perfil leva para `/`.
2. Com perfil escolhido, rota de outro perfil mostra "Esta tela é de outro perfil" e o botão "Voltar ao início" (RF-008).
3. Em `real`, toda rota de perfil mostra "Entrada em breve" até a Etapa 2.
4. A seção ativa da barra de baixo é a que tem o prefixo mais longo que casa com a rota atual.
5. Cabeçalho: título da tela, botão de voltar nas telas internas, atalho de acessibilidade e sino (RF-006).
6. O catálogo de telas fica em um único arquivo (`web/src/navigation/screens.ts`) que gera as rotas, a barra, "Mais",
   "Todos os serviços" e as chaves de tradução esperadas.
