# Quickstart: validar Acesso e cadastro

Roteiro para provar que a spec 002 está pronta. Cenários da `spec.md`; detalhes em `contracts/` e `data-model.md`.

## Ambiente

```bash
docker compose up --build -d --renew-anon-volumes   # ou make dev
```

App em http://localhost:3100. As contas de exemplo aparecem na tela de entrada (modo `dev`). Para começar do zero:
painel `/dev` → "Restaurar dados de exemplo" (recria pessoas, convites e sessões).

## Verificações automáticas

```bash
cd web && npx vitest run                                   # unitários (inclui matriz de permissões e código)
docker compose --profile e2e run --rm e2e npx playwright test --grep-invert @build
```

Cobrem: regras do código (10 min, 5 erros, 60 s, 5 por hora, número desconhecido), sessão (sair, remoção, 180 dias),
matriz de `contracts/permissoes.md` (CS-007, CS-007a), celular por país, placas, foto reduzida, seed v2, e os fluxos
de tela de cada história nos dois celulares.

## Cenários manuais

| # | Passos | Esperado | Spec |
|---|---|---|---|
| 1 | Abrir `/` sem sessão | Tela de entrada com celular (+55) e "Contas de exemplo" | H1 |
| 2 | Digitar um número fora do cadastro | "Número não cadastrado. Fale com o síndico." e nenhum código | H1-3 |
| 3 | Escolher "Responsável do 804", pedir código | Tela do código mostra o número e o aviso com o código simulado | H1-1, RF-008 |
| 4 | Errar o código 5 vezes | Código deixa de valer; oferece pedir outro | H1-4 |
| 5 | Pedir reenvio antes de 1 minuto | Botão bloqueado com contagem regressiva | H1-6 |
| 6 | Digitar o código certo (primeiro acesso) | Boas-vindas (até 4 telas, "Pular") → Regras → "Li e concordo" → Início | H2-1 a H2-3 |
| 7 | Fechar e abrir o app | Entra direto no Início | H1-7, CS-002 |
| 8 | Perfil → Convidar (nome, celular, tipo, permissões) | Pessoa aparece como "Convite pendente" | H3-2 |
| 9 | Sair; entrar com o celular convidado | Boas-vindas e regras; no Perfil do responsável, deixa de estar pendente | H3-3 |
| 10 | Responsável remove essa pessoa; tentar entrar com ela | Removida da lista; entrada recusada como número não cadastrado | H3-5, H1-10 |
| 11 | Entrar como familiar | Vê a lista do apto, sem convidar/editar/remover | H3-7 |
| 12 | Responsável cadastra carro `ABC1D23`, animal e contato de emergência | Aparecem no Perfil; contato some se removido ("Opcional · não informado") | H4 |
| 13 | Editar a própria foto com uma imagem grande | Foto aparece; guardada reduzida (≤ 512 px) | RF-025 |
| 14 | Entrar como a síndica (mora no 1201) | Pergunta o papel; escolher "Síndico"; em Ajustes, trocar para "Morador do 1201" | RF-007, CS-009 |
| 15 | Síndico → Moradores → "Sem cadastro" | 3 apartamentos; cadastrar responsável do 303 → "Convite pendente" | H5-2, H5-4 |
| 16 | Síndico busca "902" e reenvia o convite | Data do convite atualizada | H5-3, H5-5 |
| 17 | Síndico abre o 804, troca o celular de uma pessoa | Sessão da pessoa no celular antigo é encerrada | RF-021, RF-028a |
| 18 | Entrar como porteiro → Mais → Moradores → 804 | Nomes, fotos, tipos e carros; nenhum celular, animal ou contato | RF-029a |
| 19 | Trocar o idioma para inglês e espanhol nas telas novas | Todos os textos traduzidos | RF-032 |
| 20 | Conferir os cadastros | Nenhum campo de CPF, nascimento ou documento | CS-006 |
| 21 | Celular de outro país: escolher Portugal e digitar um número português | Aceito e mostrado com +351 | RF-001a |

## Versão de demonstração

```bash
cd web && npm run build:demo && ln -sfn out out-current
docker compose --profile e2e run --rm -e E2E_BUILD=1 e2e npx playwright test --grep @build
```

Esperado: a entrada e as contas de exemplo funcionam sem internet depois da primeira abertura; o painel `/dev` e o
atalho de testes `__terreoDev` não existem no modo `real`.
