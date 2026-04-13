# Project Status

## Estado Atual

- Repositorio Git sincronizado com `origin/master`
- Node e npm validados localmente
- CLI com comandos `doctor`, `setup`, `extract`, `draft-payload` e `build-payload`
- Skill pronta em `templates/skills/sicc-cadastrar-contrato`

## O Que Ja Esta Ajustado

- Higiene do Git para projeto Node
- Line endings padronizados com `.gitattributes`
- Validacao rapida com `npm run verify`

## Gargalos Tecnicos Atuais

- `src/normalize.js` depende de heuristicas simples e regexes lineares
- Nao ha suite de testes automatizados para extracao e normalizacao
- O parser escolhe o maior valor monetario do documento, o que pode gerar falso positivo
- O projeto convive com uma copia paralela fora do repositorio principal, o que pode causar confusao de manutencao

## Proximas Melhorias Recomendadas

1. Criar fixtures reais em `tests/fixtures` com contratos variados.
2. Cobrir `normalizeContractText` com testes de regressao.
3. Separar heuristicas por responsabilidade: datas, valores, fornecedor, objeto e licitacao.
4. Adicionar um comando de diagnostico de documento para mostrar o que foi inferido e por qual regra.
5. Medir desempenho de documentos grandes e reduzir leituras e regexes redundantes.
