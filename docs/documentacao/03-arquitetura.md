# Arquitetura e estrutura

## Stack

Decidida em 2026-11-15. As versões exatas são registradas quando cada parte for instalada.

| Camada | Escolha |
|---|---|
| Interface | Next.js (App Router) com TypeScript, como PWA instalável |
| Estilo e componentes | Tailwind CSS e shadcn/ui, ícones lucide |
| Idiomas | next-intl, com português, inglês e espanhol desde o início |
| Testes da interface | Vitest (componentes e serviços) e Playwright (fluxos em tela de celular) |
| API | Python com FastAPI |
| Banco de dados | PostgreSQL, com SQLAlchemy e migrações Alembic |
| Testes da API | pytest |
| Tarefas em segundo plano | ARQ com Redis (avisos agendados, lembretes, fila do WhatsApp, resumo do mês) |
| Fotos | Cloudflare R2 (compatível com S3), bucket privado com links temporários |
| WhatsApp | Evolution API, com número próprio do condomínio |
| Notificações no celular | Web Push padrão (chaves VAPID), sem serviço externo |
| Fala para texto | Reconhecimento de voz do navegador (Web Speech API) |
| Libras | VLibras, do governo federal |
| Infraestrutura | Docker Compose e Caddy (HTTPS) em uma VPS |

## Como as partes se ligam

```
Celular (PWA Next.js) ──HTTPS──> Caddy ──> /       Next.js (telas)
                                      └──> /api    FastAPI ──> PostgreSQL
                                                     │   └──> Cloudflare R2 (fotos)
                                                     └──> Redis <── ARQ (fila e agendamentos)
                                                                     ├──> Evolution API ──> WhatsApp
                                                                     └──> Web Push ──> celulares
```

- **Telas como arquivos estáticos.** O Next.js gera, no build, um arquivo por tela (exportação estática). Não há
  servidor de interface em produção; o Caddy (ou o Cloudflare Pages, na demonstração) só entrega os arquivos.
- **Next.js só cuida das telas.** As regras de negócio ficam na API. O navegador chama a API no mesmo domínio
  (`/api`), e o cookie de sessão vale para os dois.
- **Front-end primeiro.** As telas usam serviços com tipos definidos. Primeiro esses serviços usam dados locais, para
  validar as telas com o síndico. Depois passam a chamar a API, sem mudar as telas.
- **Envios passam por uma fila.** Avisos, códigos de login e alertas viram tarefas no Redis. O ARQ entrega cada uma
  ao WhatsApp e ao push, respeitando as preferências do morador (exceto emergências) e um ritmo que evita bloqueio do
  número.
- **Vários condomínios.** Todo dado pertence a um condomínio, e toda consulta filtra por ele. O piloto tem só o
  Edifício Taquaretinga cadastrado.

## Pessoas e papéis (spec 002)

- Uma **pessoa** é quem entra com o celular (nome, celular, foto). Ela pode ter mais de um **papel**: morador de um
  apartamento, porteiro ou síndico. A síndica que mora no 1201 é uma pessoa com dois papéis e escolhe com qual entrar.
- Toda operação dos serviços sabe quem está agindo e confere uma **matriz de permissões** única
  (`specs/002-acesso-e-cadastro/contracts/permissoes.md`): só o responsável convida; o síndico edita qualquer pessoa;
  a portaria só consulta nome, foto, tipo e carros. Sem ninguém conectado, nada funciona além da entrada.

## Login e sessão

**Hoje (Etapa 2, provisório):** o código e a sessão são simulados no próprio aparelho, com as mesmas regras que o
servidor terá — 6 dígitos guardados só como hash, 10 minutos de validade, 5 tentativas, reenvio após 1 minuto, até 5
pedidos por hora, sessão encerrada ao sair, ao ser removido, ao trocar o celular ou após 180 dias sem uso. A mensagem
"enviada" pelo WhatsApp fica numa caixa de saída simulada, mostrada na tela só no desenvolvimento e na demonstração.
Na versão real, a entrada mostra "Entrada em breve" até a Etapa 3.

**Na Etapa 3:** o morador digita o celular e recebe um código pelo WhatsApp. Depois de confirmado, a sessão fica em um cookie
protegido (httpOnly e, em produção, Secure) com um token aleatório. O banco guarda só o hash desse token. A sessão
expira após 6 meses sem uso e pode ser encerrada pelo responsável do apartamento ou pelo síndico, por exemplo quando
alguém se muda ou troca de celular.

## Identidade visual

- Kit da marca: laranja `#E8590C`, branco `#FFFFFF`, marrom `#7A4E35` e creme `#F4EEE2`; mascote sabiá-laranjeira;
  nome e títulos em Plus Jakarta Sans, peso 800.
- O laranja exato (`#E8590C`) vai no ícone do app, nos quadrados dos ícones, no mascote e em faixas grandes. Com
  texto branco ele tem contraste 3,58, abaixo do mínimo de leitura (4,5); por isso botões e textos usam o mesmo laranja
  mais escuro, `#C2410C` (5,18). Fundos secundários são creme com texto marrom.
- No tema escuro, o fundo é um marrom bem escuro e os textos são creme; o alto contraste escurece o laranja
  (`#9A3412`) para chegar a AAA.
- O mascote colorido aparece só em telas grandes (boas-vindas), como pede o kit.
- Cores só pelos tokens de `web/src/theme/tokens.css`; um teste automático confere as cores da marca e o contraste.

## Portas locais

Interface 3100, API 8100, PostgreSQL 5440, Redis 6390 (sem colidir com os outros projetos).

## Riscos conhecidos

- **Evolution API não é oficial.** O número pode ser bloqueado pelo WhatsApp se enviar mensagens demais ou receber
  denúncias. Por isso os envios têm ritmo controlado e o serviço de envio pode ser trocado pela API oficial da Meta, que
  porém não envia para grupos.
- **Voz no iPhone.** O reconhecimento de voz do navegador funciona melhor no Chrome do Android. O aparelho da portaria
  deve ser Android.
- **Push no iPhone.** Só funciona com o app instalado na tela inicial (iOS 16.4 ou mais recente).

## Onde está cada coisa

| Caminho | Conteúdo |
|---|---|
| `README.md` | Apresentação rápida do projeto. |
| `CLAUDE.md` | Orientações para o Claude Code trabalhar no repositório. |
| `web/app/` | Rotas da interface: escolha de perfil, `/resident`, `/front-desk`, `/manager`, `/settings` e o painel `/dev`. |
| `web/src/navigation/screens.ts` | Catálogo único de telas: gera rotas, barra de baixo, "Mais" e "Todos os serviços". |
| `web/src/services/` | Serviços de dados: contratos, esquemas, permissões (`permissions.ts`), entrada (`auth.ts`), pessoas e apartamentos (`household.ts`), IndexedDB, memória e dados de exemplo (`local/seed.ts`). |
| `web/src/auth/` | Sessão do aparelho, guarda de acesso e o atalho de testes (só em desenvolvimento e demonstração). |
| `web/src/phone/` · `web/src/photo/` · `web/src/lib/crypto.ts` | Celular por país, redução da foto e criptografia que funciona também fora de HTTPS. |
| `web/app/login/` · `welcome/` · `rules-accept/` · `choose-role/` | Entrada, primeiro acesso e escolha de papel. |
| `web/src/preferences/` | Idioma, tema, alto contraste e tamanho de letra, aplicados antes da primeira pintura. |
| `web/src/theme/tokens.css` | Cores das quatro aparências (claro, escuro e cada um com alto contraste). |
| `web/messages/` | Textos em português, inglês e espanhol. |
| `web/sw.ts` · `web/scripts/` | Service worker (uso sem internet) e scripts de build. |
| `web/tests/` | Testes unitários (Vitest) e de ponta a ponta (Playwright). |
| `api/app/` | API em FastAPI (`/api/health`), configuração e worker do ARQ. |
| `api/alembic/` | Migrações do banco. |
| `docker-compose.yml` · `Makefile` · `.env.example` | Ambiente local e comandos. |
| `docs/documentacao/` | Fonte desta documentação, em Markdown, um arquivo por capítulo. |
| `docs/backlog.md` | Plano de desenvolvimento: etapas e o que falta fazer. |
| `docs/changelog.md` | Histórico do que foi adicionado, alterado e removido, por data. |
| `docs/pdf/terreo-documentacao.pdf` | Documentação completa em PDF, gerada a partir dos arquivos acima. |
| `docs/assets/` | Imagens usadas na documentação. |
| `scripts/gerar_pdf.py` | Gera o PDF da documentação. |
| `specs/NNN-nome/` | Especificação, plano e tarefas de cada funcionalidade (Spec Kit). |
| `.specify/` | Configuração, modelos e constituição do Spec Kit. |
| `.claude/skills/` | Comandos do Claude Code (`/speckit-*` e `/encerrar-dia`). |

Esta tabela é atualizada sempre que uma pasta nova surgir.
