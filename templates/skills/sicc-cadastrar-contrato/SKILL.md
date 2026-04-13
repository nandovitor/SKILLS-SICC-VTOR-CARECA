---
name: sicc-cadastrar-contrato
description: Cadastro de contratos e atas no SICC via MCP, com foco em acertar na primeira tentativa usando o fluxo correto de prechecagens, descoberta de IDs obrigatorios, montagem de payload valido e envio pelo tool `cadastrar_contrato_ata`. Use quando o pedido envolver frases como "cadastrar contrato no SICC", "importar contrato", "criar contrato/ata no SICC", "usar MCP SICC para contrato", "ler PDF/DOCX e montar payload do SICC", ou quando for preciso evitar tentativas lentas, instalacoes desnecessarias e erros de payload.
---

# SICC Cadastrar Contrato

## Objetivo

Executar o cadastro de contrato no SICC pelo MCP sem instalar dependencias durante a tarefa.

Se houver PDF, DOCX, TXT ou Markdown, usar primeiro o comando `sicc-codex draft-payload <arquivo>` para extrair texto e montar um rascunho de payload com campos detectados e pendencias explicitas.

## Fluxo Obrigatorio

1. Identificar se a entrada vem de texto direto ou documento.
2. Se vier de documento, rodar `sicc-codex draft-payload <arquivo>`.
3. Resolver `tenant_id` e IDs obrigatorios via MCP.
4. Verificar duplicidade por numero do contrato, se houver.
5. Montar ou completar o payload final.
6. Executar `mcp__sicc__cadastrar_contrato_ata`.

## Ferramentas e Comandos

- `mcp__sicc__get_organizacoes_tool`
- `mcp__sicc__search_contrato_by_numero_tool`
- `mcp__sicc__get_objeto_resumido_tool`
- `mcp__sicc__get_unidades_tool`
- `mcp__sicc__get_modalidades_licitacao_tool`
- `mcp__sicc__cadastrar_contrato_ata`
- `sicc-codex draft-payload <arquivo>`
- `sicc-codex build-payload --input <json>`

## Regras

- Nao instalar pacotes para esse fluxo no meio da tarefa.
- Nao inventar IDs; sempre resolver no MCP.
- Nao deixar `unidades_participantes` vazio.
- Nao trocar o objeto do documento por resumo generico.
- Quando nao houver itens, usar lote unico com item unico.

## Roteiro de IDs

1. Descobrir `tenant_id` com `mcp__sicc__get_organizacoes_tool`.
2. Buscar `objeto_resumido_id` usando `normalized.hints.objeto_resumido_busca` quando existir.
3. Buscar `unidade_gerenciadora_id` e `unidades_participantes` pelos nomes detectados no rascunho.
4. Buscar `modalidade_id` usando `normalized.hints.modalidade_nome`.

## Recursos

- Ler [fluxo-cadastro](references/fluxo-cadastro.md).
- Ler [payloads](references/payloads.md).
