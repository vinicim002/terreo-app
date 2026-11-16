# Pesquisa: Acesso e cadastro

Decisões técnicas da spec 002. A stack está na constituição 1.2.0 (princípio VI); a base vem da spec 001 (serviços
tipados sobre IndexedDB, catálogo de telas, preferências do aparelho, modos `dev` / `demo` / `real`).

## R1. Pessoa, papéis e o modelo da spec 001

- **Decisão**: separar **Pessoa** (quem entra: nome, celular, foto, datas de acesso) dos **papéis** que ela tem:
  - `Residency` — morador de um apartamento (substitui o `Resident` da spec 001): tipo, responsável, permissões,
    situação do convite;
  - `Staff` ganha `personId` (porteiros entram; faxineiros não, `personId` nulo);
  - `ManagerAssignment` — síndico do condomínio.
  Uma pessoa (um celular) pode ter vários papéis (esclarecimento da spec).
- **Por quê**: o celular identifica a pessoa, não o papel; o síndico que mora no 804 é uma pessoa só, com dois papéis.
- **Migração**: os dados de exemplo sobem para `SEED_VERSION = 2`; aparelhos com a versão 1 recriam os dados (são
  fictícios, nada se perde). Os serviços da spec 001 (`residents.listByApartment`, `get`) passam a devolver a visão
  `ResidentView` (pessoa + morador), mantendo os nomes dos métodos.
- **Alternativas**: um registro por papel com celular repetido — quebraria "um celular, uma pessoa" (RF-017).

## R2. Quem está agindo: o contexto dos serviços

- **Decisão**: `ServiceContext` ganha `actor` (`personId` e o papel ativo). Toda operação confere a permissão no
  serviço (RF-030), por uma função única `can(actor, ação, alvo)` com a matriz de `contracts/permissoes.md`.
  Sem `actor` (antes de entrar), só os serviços de entrada funcionam.
- **Por quê**: as regras valem igual quando a API existir; a tela só esconde o que o serviço já recusaria.
- **Erros**: recusa de permissão → `ServiceError("forbidden")`; alvo de outro apartamento ou condomínio →
  `not_found` (não revela que existe).

## R3. Entrada com código (simulada)

- **Decisão**: serviço `auth` local que segue as regras da spec como se fosse o servidor:
  - `requestCode(phone)`: normaliza o celular. Se não há pessoa ativa ou com convite pendente com esse celular,
    devolve `{ status: "unknown" }` sem criar código, e a tela mostra "Número não cadastrado. Fale com o síndico."
    (H1-3). A mesma resposta vale para pessoa removida ou de outro condomínio, sem revelar o motivo (RF-009).
  - Código de 6 dígitos aleatório (`crypto.getRandomValues`), guardado só como hash SHA-256 com sal
    (`crypto.subtle`); vale 10 min; 5 tentativas erradas; novo pedido invalida o anterior; reenvio após 60 s; até 5
    pedidos por hora por número (RF-003).
  - O "envio" grava uma `OutboxMessage` (código ou convite) no aparelho. Nos modos `dev` e `demo`, um aviso na tela
    mostra a última mensagem enviada ao número (RF-008). No modo `real`, a tela de entrada continua "Entrada em
    breve" até a Etapa 3 — não há servidor para enviar o código de verdade.
  - `verifyCode(phone, code, deviceId)` cria a `Session` e devolve os papéis da pessoa.
- **Por quê**: o fluxo, as mensagens de erro e os limites ficam prontos e testados; na Etapa 3, a mesma interface
  chama a API, que fará exatamente isso no servidor e enviará pela fila do WhatsApp.
- **Alternativas**: login falso com um botão — não testaria limites nem erros, e o fluxo seria refeito depois.

## R4. Sessão no aparelho

- **Decisão**: `deviceId` aleatório guardado em `localStorage` (`terreo:device`); a `Session` fica no IndexedDB com
  `personId`, `deviceId`, papel ativo, `createdAt`, `lastSeenAt`, `endedAt` e `endReason`. Ao abrir o app,
  `auth.current(deviceId)` confere: sessão encerrada, pessoa removida ou `lastSeenAt` com mais de 180 dias → sem
  sessão (RF-004, RF-006, CS-008). `lastSeenAt` é atualizado a cada abertura.
- **Constituição**: o princípio III e as restrições pedem sessão em cookie httpOnly com hash no banco — isso vale
  para a API (Etapa 3). Aqui não há servidor nem dado real; o desvio é temporário e está justificado em
  "Acompanhamento de complexidade" do `plan.md`.
- **Remoção**: remover uma pessoa encerra todas as sessões dela (`endReason: "removed"`); trocar o celular encerra as
  sessões do número antigo.

## R5. Celular com país (libphonenumber-js)

- **Decisão**: `libphonenumber-js` (metadados "min") para normalizar e validar por país; o seletor de país lista os
  países do pacote, com nome no idioma do app via `Intl.DisplayNames` e o Brasil (+55) primeiro (RF-001a).
  Guardar sempre em E.164 (`+5521987654321`).
- **Dados de exemplo**: os celulares fictícios usam o DDD inexistente `00` (spec 001), que a validação real recusa.
  Regra: `isValidPhoneNumber(n)` **ou** (modo `dev`/`demo` **e** número começa com `+5500`). No modo `real`, só
  números válidos.
- **Alternativas**: regex própria — não cobre outros países; `react-phone-number-input` — componente pronto, mas
  traz estilo próprio e dependências; um seletor simples com os tokens do tema é suficiente.

## R6. Placas, animais e contato de emergência

- **Placa**: aceita `ABC-1234`, `ABC1234` e Mercosul `ABC1D23`, em maiúsculas; guardada sem hífen; exibida com hífen
  no formato antigo. Única por condomínio.
- **Animal**: tipos `dog`, `cat`, `bird`, `other`.
- **Contato de emergência**: no máximo um por apartamento; celular com a mesma regra do R5.

## R7. Foto do perfil

- **Decisão**: a foto escolhida é reduzida no aparelho (`createImageBitmap` + `<canvas>`) para no máximo 512 × 512 px,
  JPEG com qualidade 0,8, e guardada como texto `data:` na própria pessoa (≈ 40–80 KB). Na Etapa 3 vai para o R2.
- **Entrada**: `<input type="file" accept="image/*" capture="user">` — abre câmera ou galeria no celular.

## R8. Fluxo de telas e guarda de acesso

- **Decisão**: o `ProfileGuard` da spec 001 vira `AccessGuard`, baseado na sessão:
  sem sessão → `/login/`; com sessão e vários papéis sem escolha → `/choose-role/`; morador sem boas-vindas/regras →
  `/welcome/` e depois `/rules-accept/`; papel diferente do prefixo → "Esta tela é de outro perfil".
- **Escolha de perfil da spec 001**: a página `/` passa a ser a entrada (`/login/`). Nos modos `dev` e `demo`, a tela
  de entrada mostra "Contas de exemplo" (síndico, porteiro, responsável, familiar, convite pendente): tocar preenche o
  celular e pede o código — o mesmo fluxo de qualquer pessoa (RF-007).
- **Testes**: nos modos `dev`/`demo`, `window.__terreoDev.signInAs(phone, role?)` cria a sessão direto, para os testes
  e2e não repetirem o fluxo do código; não existe no modo `real` (o mesmo critério do painel `/dev`).

## R9. Regras e boas-vindas

- **Regras**: `Rule` com tema, título, texto e ordem; conteúdo de exemplo nos dados do seed (temas: convivência e
  silêncio, elevador e mudanças, lixo e reciclagem, animais, garagem, áreas comuns). Busca sem acento e sem
  maiúsculas/minúsculas. Os textos das regras são do condomínio (dados), não da interface: ficam em português nos
  dados de exemplo; a tradução de conteúdo do condomínio fica para depois.
- **Boas-vindas**: 4 telas com textos da interface (traduzidos), com "Pular" e indicador de passo.

## R10. Lista do síndico

- **Decisão**: um serviço `apartments.overview(ctx, filtro, busca)` monta, por apartamento: responsável, tipo,
  pessoas, situação (`active` / `pending` / `none`) e data do último convite; filtros com contagem; busca sem acento por
  número ou nome. 48 apartamentos cabem em memória; sem paginação.
