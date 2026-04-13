# Fluxo de Cadastro no SICC

## Roteiro

1. Se houver arquivo, gerar rascunho com `sicc-codex draft-payload`.
2. Descobrir `tenant_id`.
3. Verificar duplicidade por numero.
4. Resolver `objeto_resumido_id`, unidade e modalidade.
5. Enviar o payload pelo MCP.

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
