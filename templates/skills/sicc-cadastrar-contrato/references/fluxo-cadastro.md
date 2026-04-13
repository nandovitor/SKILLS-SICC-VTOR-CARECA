# Fluxo de Cadastro no SICC

## Roteiro

1. Rodar `sicc-codex doctor` em maquina nova ou ambiente suspeito.
2. Se necessario, rodar `sicc-codex setup`.
3. Se houver arquivo, gerar rascunho com `sicc-codex draft-payload`.
4. Descobrir `tenant_id`.
5. Verificar duplicidade por numero.
6. Resolver `objeto_resumido_id`, unidade e modalidade.
7. Enviar o payload pelo MCP.

## Rascunho do Documento

O rascunho retornado pelo CLI traz:

- `payloadDraft`: estrutura quase pronta
- `hints`: termos de busca para o MCP
- `unresolved`: campos que precisam de complemento

## Fechamento do Payload

Completar manualmente ou por inferencia segura:

- `tenant_id`
- `objeto_resumido_id`
- `unidade_gerenciadora_id`
- `unidades_participantes`
- `modalidade_id`

Depois usar `sicc-codex build-payload --input arquivo.json` se quiser validar antes do MCP.
