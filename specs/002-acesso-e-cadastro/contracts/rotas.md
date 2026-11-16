# Contrato: rotas (acréscimos e mudanças da spec 002)

Continua `specs/001-base-do-app/contracts/rotas.md`. Detalhes por `?id=` (exportação estática, research R1 da 001).

## Gerais

| Rota | Tela | Observação |
|---|---|---|
| `/` | Redireciona: sem sessão → `/login/`; com sessão → início do papel ativo | substitui a escolha de perfil |
| `/login/` | Celular com país + "Receber código no WhatsApp"; em `dev`/`demo`, "Contas de exemplo" | `real`: "Entrada em breve" até a Etapa 3 |
| `/login/code/` | 6 dígitos, número de destino, reenviar em 60 s, aviso da mensagem simulada (`dev`/`demo`) | |
| `/choose-role/` | Escolher papel (ex.: "Morador do 1201" ou "Síndico") | só com mais de um papel |
| `/welcome/` | Boas-vindas do morador, até 4 passos, "Pular" | primeiro acesso |
| `/rules-accept/` | Regras + "Li e concordo com as regras" | primeiro acesso, obrigatório |
| `/settings/` | Ganha "Trocar papel" (se houver mais de um) e "Sair"; perde "Trocar perfil" | |

## Morador (`/resident`)

| Rota | Tela | Antes (spec 001) |
|---|---|---|
| `/resident/profile/` | Perfil: dados, "Moram no apto", carros e animais, contato de emergência, "Sair" | vazia |
| `/resident/profile/edit/` | Editar o próprio nome e foto | nova |
| `/resident/invite/` | Convidar pessoa (só responsável) | vazia |
| `/resident/person/?id=` | Pessoa do apto: ver; editar, reenviar e remover (só responsável) | nova |
| `/resident/vehicle/?id=` | Carro: novo (sem `id`) ou editar/remover | nova |
| `/resident/pet/?id=` | Animal: novo ou editar/remover | nova |
| `/resident/emergency-contact/` | Contato de emergência | nova |
| `/resident/rules/` | Regras com busca | vazia |
| `/resident/welcome/` | Rever as boas-vindas | vazia |

## Portaria (`/front-desk`)

| Rota | Tela |
|---|---|
| `/front-desk/residents/` | Consultar apartamento: grade de números + busca; mostra nome, foto, tipo e carros (RF-029a) — novo item em "Mais" |
| `/front-desk/rules/` | Regras — novo item em "Mais" |

## Síndico (`/manager`)

| Rota | Tela | Antes |
|---|---|---|
| `/manager/residents/` | Apartamentos: totais, filtros com contagem, busca, situação | vazia |
| `/manager/apartment/?id=` | Apartamento: pessoas, carros, animais; editar/remover pessoa; reenviar convite; trocar responsável | nova |
| `/manager/apartment/register/?id=` | Cadastrar responsável (nome, celular, tipo) | nova |
| `/manager/person/?id=` | Editar pessoa (nome, tipo, celular, permissões) ou remover | nova |
| `/manager/rules/` | Regras | vazia |

## Guarda de acesso (substitui as regras 1 a 3 da spec 001)

1. Sem sessão válida → `/login/` (guardando a rota pedida para voltar depois de entrar).
2. Vários papéis e nenhum escolhido → `/choose-role/`.
3. Morador com `needsWelcome` → `/welcome/`; com `needsRulesAcceptance` → `/rules-accept/`.
4. Prefixo diferente do papel ativo → "Esta tela é de outro perfil" (como na spec 001).
5. Modo `real` → "Entrada em breve" (até a Etapa 3).
