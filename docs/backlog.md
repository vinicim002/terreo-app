# Backlog e plano de desenvolvimento

Legenda: [x] feito · [ ] a fazer. Itens marcados **Proposta** ainda não foram debatidos e podem mudar.

O piloto será lançado com **todas as funcionalidades do minimundo**, exceto "Ideias para o futuro". A construção é
**front-end primeiro**: as telas nascem com dados locais e depois passam a usar a API.

## Etapa 0 — Fundação

- [x] Repositório no GitHub, `.gitignore` e README.
- [x] Spec Kit instalado e constituição.
- [x] Documentação em `docs/` com geração de PDF e rotina de encerramento do dia.
- [x] Definir a stack técnica e registrar na constituição (1.2.0).
- [ ] Tirar as dúvidas abertas com o síndico (reuniões, rodízio de folgas, horário dos faxineiros, outras necessidades).

## Etapa 1 — Base do app (spec 001)

- [x] Monorepo com `web/` (Next.js) e `api/` (FastAPI), Docker Compose para o ambiente local.
- [x] PWA instalável com os ícones do kit, tema claro, escuro e alto contraste, três idiomas, navegação por perfil.
- [x] Camada de serviços tipados com dados locais (trocável pela API).
- [x] Painel de desenvolvimento: andamento, backlog, changelog, commits e documentos.
- [ ] Publicar a demonstração no Cloudflare Pages (passos em `04-desenvolvimento.md`; precisa da conta Cloudflare).
- [ ] Validar em celulares reais: instalação no Android e no iPhone, VLibras, "seguir o celular" no iPhone.
- [ ] Validar em celulares reais as telas da spec 002: foto do perfil pela câmera e textos em inglês e espanhol.
- [ ] Validar em celulares reais as telas da spec 003: campos de data e hora, calendário e o sino.
- [ ] Validar em celulares reais as telas da spec 004: câmera da encomenda, ditar (Android e iPhone) e botões da portaria.
- [ ] Validar em celulares reais a spec 005: segurar 3 s no toque, som e vibração da tela cheia na portaria, ligar e
  abrir o WhatsApp pelos contatos.
- [ ] Conferir com o síndico os números das concessionárias nos contatos (Light, Naturgy e Águas do Rio são exemplos)
  e cadastrar o número real da portaria antes do lançamento.
- [ ] Conferir a licença do desenho do mascote (sabiá) antes do lançamento, como avisa o kit da marca.

## Etapa 2 — Telas com dados locais (Proposta)

Ordem sugerida, uma spec por grupo:

- [x] Acesso e cadastro (spec 002): login com código simulado, papéis, boas-vindas e regras, perfil, convites,
  carros, animais, contato de emergência, apartamentos do síndico e consulta da portaria.
- [x] Comunicação (spec 003): avisos (agendar, importante, confirmação, véspera, editar, resolvido), agenda do mês,
  reuniões com pauta e resumo, enquetes (oficiais com voto do responsável e sugestões), central de notificações e
  "Como receber", com WhatsApp simulado (grupo para assuntos gerais, privado só para pessoais).
- [x] Portaria (spec 004): códigos de entrega pelo app e pelo WhatsApp (simulado), encomenda com foto, correspondência,
  retirada, lembrete de encomenda parada, visitantes e prestadores, modo viagem, equipe de plantão, ditar e recados ao
  síndico, achados e perdidos.
- [x] Segurança (spec 005): botão de emergência (segurar 3 s, tela cheia na portaria de plantão, "Estou indo",
  cancelar, resolver, repetição em 2 min, contato de emergência avisado, "SOS" pelo WhatsApp simulado), alerta geral
  (tela cheia, grupo e privado de todos, encerrar), contatos importantes e histórico de 90 dias.
- [ ] Participação: sugestões, melhorias, avisar problema, barulho, prestadores, comércio, pesquisa de satisfação.
- [ ] Administração: mudanças e obras, edição da escala e rodízio de folgas (depende do síndico), controle ou chave, advertências, prestação de contas, resumo do mês, lembretes,
  perguntas frequentes, apartamento disponível.
- [ ] Acessibilidade: tamanho de letra, contraste, leitura em voz alta, legendas, VLibras.

## Etapa 3 — API e integrações (Proposta)

- [ ] Modelo de dados multi-condomínio, sessão e permissões por perfil.
- [ ] API de cada grupo da Etapa 2, trocando os dados locais.
- [ ] Fila ARQ, WhatsApp (Evolution API), Web Push e fotos no R2.
- [ ] Comunicação no servidor (spec 003): `runDue` como tarefa agendada do ARQ, `notify` como entrada da fila, testes
  pytest das regras (permissões, um voto por apartamento, canais, isolamento entre condomínios) e confirmar leitura
  respondendo à mensagem no WhatsApp.
- [ ] Portaria no servidor (spec 004): webhook do WhatsApp para códigos de entrega (`parseDeliveryMessage`), foto no
  privado e no R2, pytest das regras (permissões, quem é avisado, lembretes, isolamento entre condomínios).
- [ ] Segurança no servidor (spec 005): Web Push e atualização em tempo real no lugar da consulta a cada 1 s e 3 s,
  repetição do alerta como tarefa do ARQ, "SOS" no webhook do WhatsApp, pytest das regras (permissões, quem recebe,
  repetição, alerta geral ignorando preferências, isolamento entre condomínios).

## Etapa 4 — Piloto (Proposta)

- [ ] Antes de abrir para os moradores: trocar todos os segredos (token do Cloudflare Tunnel `terreo-prod`, que ficou
  exposto numa sessão local em 2026-11-17, senha do banco e qualquer chave criada até lá).

- [ ] VPS com Docker Compose e Caddy, backups.
- [ ] Cadastro do Edifício Taquaretinga, vídeo curto de instalação e lançamento.
