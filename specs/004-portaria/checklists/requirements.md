# Checklist de qualidade da especificação: Portaria

**Objetivo**: validar se a especificação está completa e com qualidade antes do planejamento
**Criada em**: 2026-11-17
**Funcionalidade**: [spec.md](../spec.md)

## Qualidade do conteúdo

- [x] Sem detalhes de implementação (linguagens, frameworks, APIs)
- [x] Focada no valor para o usuário e nas necessidades do negócio
- [x] Escrita para pessoas não técnicas
- [x] Todas as seções obrigatórias preenchidas

## Completude dos requisitos

- [x] Nenhum marcador [NEEDS CLARIFICATION] restante
- [x] Requisitos testáveis e sem ambiguidade
- [x] Critérios de sucesso mensuráveis
- [x] Critérios de sucesso sem tecnologia (sem detalhes de implementação)
- [x] Todos os cenários de aceite definidos
- [x] Casos-limite identificados
- [x] Escopo bem delimitado
- [x] Dependências e premissas identificadas

## Prontidão da funcionalidade

- [x] Todos os requisitos funcionais têm critério de aceite claro
- [x] Os cenários cobrem os fluxos principais
- [x] A funcionalidade atende aos resultados mensuráveis dos critérios de sucesso
- [x] Nenhum detalhe de implementação vaza para a especificação

## Notas

- Escopo grande por decisão do usuário (Portaria numa spec só): 6 histórias independentes, em ordem de prioridade.
- Decisões tomadas como padrão e registradas nas Premissas e nos requisitos (a revisar no `/speckit-clarify`):
  lembrete de encomenda parada a partir de 3 dias; código sem chegada sai após 7 dias; a portaria também pode registrar
  a retirada; quem tem "Pode cadastrar entregas" ativa o modo viagem; achados ficam 60 dias; escala semanal sem o
  rodízio de folgas.
