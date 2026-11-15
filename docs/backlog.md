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

## Etapa 1 — Base do app (Proposta)

- [ ] Monorepo com `web/` (Next.js) e `api/` (FastAPI), Docker Compose para o ambiente local.
- [ ] PWA instalável com os ícones do kit, tema claro, escuro e alto contraste, três idiomas, navegação por perfil.
- [ ] Camada de serviços tipados com dados locais (trocável pela API).
- [ ] Painel de desenvolvimento: andamento, backlog, changelog, commits e documentos.

## Etapa 2 — Telas com dados locais (Proposta)

Ordem sugerida, uma spec por grupo:

- [ ] Acesso e cadastro: login, apartamentos, moradores, perfil, boas-vindas e regras.
- [ ] Comunicação: avisos, calendário, reuniões, enquetes, notificações.
- [ ] Portaria: entregas e códigos, correspondência, visitantes, modo viagem, plantão, voz, achados e perdidos.
- [ ] Segurança: botão de emergência, alerta geral, contatos.
- [ ] Participação: sugestões, melhorias, avisar problema, barulho, prestadores, comércio, pesquisa de satisfação.
- [ ] Administração: mudanças e obras, controle ou chave, advertências, prestação de contas, resumo do mês, lembretes,
  perguntas frequentes, apartamento disponível.
- [ ] Acessibilidade: tamanho de letra, contraste, leitura em voz alta, legendas, VLibras.

## Etapa 3 — API e integrações (Proposta)

- [ ] Modelo de dados multi-condomínio, sessão e permissões por perfil.
- [ ] API de cada grupo da Etapa 2, trocando os dados locais.
- [ ] Fila ARQ, WhatsApp (Evolution API), Web Push e fotos no R2.

## Etapa 4 — Piloto (Proposta)

- [ ] VPS com Docker Compose e Caddy, backups.
- [ ] Cadastro do Edifício Taquaretinga, vídeo curto de instalação e lançamento.
