<!--
Relatório de sincronização
- Versão: (modelo) → 1.0.0 (primeira versão)
- Princípios criados: I a VII; seções "Restrições do Terreo", "Fluxo de trabalho" e "Governança".
- Em aberto: stack (princípio VI) ainda será definida; comandos de teste e lint entram quando existirem.
- Modelos em .specify/templates/: sem mudança necessária
-->

# Constituição do Terreo

## Princípios

### I. Português em tudo que a pessoa lê

Especificações, planos, tarefas, documentação, textos da interface, mensagens de erro e comentários são em português do
Brasil, com acentuação correta. Identificadores de código (variáveis, funções, tabelas, colunas, rotas) ficam em
inglês. Textos da interface ficam separados do código, porque o app também será usado em inglês e espanhol. Datas
mostradas à pessoa seguem o fuso de Brasília.

**Por quê**: quem usa e quem mantém o app lê português; o código segue o padrão das bibliotecas.

### II. A documentação é a fonte oficial

`specs/NNN-nome/` descreve cada mudança. O `spec.md` diz **o quê e por quê**, sem tecnologia; a tecnologia fica no
`plan.md`. Decisões em aberto ficam marcadas como em aberto, não supostas. As regras de negócio do produto (o
"minimundo") são a referência de toda spec.

**Por quê**: o que não está escrito se perde quando outra pessoa entra no projeto.

### III. Segurança e dados pessoais primeiro (INEGOCIÁVEL)

- Guardar o mínimo: nada de CPF, data de nascimento ou número de documento de visitantes.
- Telefones, fotos, placas, entregas e códigos de entrega são dados pessoais (LGPD): acesso só com login e só para
  quem precisa. Códigos e entregas de um morador nunca vão para o grupo do WhatsApp nem para outros moradores.
- Avisos anônimos (como o de barulho) não guardam nem mostram quem enviou.
- Segredos (tokens, senhas, chaves de API, credenciais do WhatsApp) só em variáveis de ambiente (`.env`), nunca no
  código nem no repositório. Nenhum arquivo sensível ou dado real de moradores é versionado.
- Toda rota que altera dados exige login e confere o perfil (morador, portaria, síndico).

**Por quê**: o app guarda dados de famílias que moram no mesmo prédio; um vazamento afeta a segurança física delas.

### IV. Para qualquer pessoa usar

- A tela da portaria é a mais simples possível: botões grandes, ícones, pouco texto, e todo registro pode ser feito por
  voz.
- Acessibilidade é requisito: tamanho de letra, alto contraste, leitura em voz alta, legendas, modo escuro e Libras.
- Entrar sem senha (código pelo WhatsApp) e sem baixar app de loja (PWA instalado pelo link).

**Por quê**: o público inclui idosos e funcionários com pouca familiaridade com tecnologia.

### V. WhatsApp junto, não no lugar

Tudo o que é importante também chega pelo WhatsApp do condomínio: avisos gerais no grupo, avisos pessoais no privado.
Funções essenciais (como informar código de entrega) precisam funcionar também por mensagem no WhatsApp. Alertas de
emergência chegam sempre a todos, sem respeitar preferências de notificação.

**Por quê**: ninguém pode ficar de fora por não usar o app.

### VI. Simples e na stack combinada

A stack ainda será definida e registrada aqui quando decidida. Depois disso, dependência nova, serviço novo ou camada
nova só entra com justificativa no `plan.md` (seção de complexidade). Funcionalidades da seção "Ideias para o futuro"
do minimundo não entram sem spec própria.

**Por quê**: um app simples no começo é mais fácil de ajustar durante o piloto.

### VII. Pronto é verificado

Toda regra de negócio tem teste automatizado cobrindo o caminho feliz, a recusa por permissão e os casos-limite da
spec. Telas são validadas pelo `quickstart.md` da spec, com os cenários escritos antes da implementação. Os comandos de
teste e lint entram aqui quando a stack for definida.

**Por quê**: o teste e o roteiro de validação são a revisão quando não há outra pessoa revisando.

## Restrições do Terreo

- Três perfis com interfaces distintas: morador, portaria (porteiros e funcionários) e síndico.
- A unidade é o apartamento. O síndico cadastra o apartamento e o morador responsável; só o responsável convida ou
  remove as outras pessoas do apartamento. Enquetes oficiais têm um voto por apartamento.
- Piloto: Edifício Taquaretinga.

## Fluxo de trabalho

- Spec Kit: `/speckit-specify` → (`/speckit-clarify`) → `/speckit-plan` → `/speckit-tasks` → (`/speckit-analyze`) →
  `/speckit-implement`. Cada mudança relevante tem sua pasta em `specs/NNN-nome/`, numerada em sequência.
- Correção pequena e óbvia (texto, bug de uma linha) não precisa de spec.
- Commits: `<prefixo em inglês>: <descrição em português>` (ex.: `feat: adiciona cadastro de entregas`). Autor é só a
  pessoa que fez o commit; **nunca** coautor de IA, `Co-Authored-By` de ferramenta ou "Generated with". Commitar só
  quando o desenvolvedor pedir.
- Antes de cada commit, conferir que nenhum arquivo sensível (`.env`, credenciais, dados reais) está incluído.

## Governança

Esta constituição vale acima de qualquer outro guia do projeto. Todo `plan.md` confere cada princípio na
"Verificação da constituição"; violação só entra justificada na seção de complexidade. Versão: MAIOR remove ou
redefine princípio; MENOR acrescenta princípio ou seção; CORREÇÃO só ajusta texto.

**Versão**: 1.0.0 | **Ratificada**: 2026-11-15 | **Última alteração**: 2026-11-15
