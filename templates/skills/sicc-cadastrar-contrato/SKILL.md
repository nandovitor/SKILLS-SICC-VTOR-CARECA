---
name: sicc-cadastrar-contrato
description: Cadastro de contratos e atas no SICC via MCP, com foco em acertar na primeira tentativa usando o fluxo correto de prechecagens, descoberta de IDs obrigatorios, montagem de payload valido e envio pelo tool `cadastrar_contrato_ata`. Use quando o pedido envolver frases como "cadastrar contrato no SICC", "importar contrato", "criar contrato/ata no SICC", "usar MCP SICC para contrato", "ler PDF/DOCX e montar payload do SICC", ou quando for preciso evitar tentativas lentas, instalacoes desnecessarias e erros de payload.
---

# SICC Cadastrar Contrato

## Objetivo

Executar o cadastro de contrato no SICC pelo MCP com ambiente pronto no shell do Codex e sem depender de install global manual do toolkit.

Se houver PDF, DOCX, TXT ou Markdown, usar primeiro o launcher do toolkit para extrair texto e montar um rascunho de payload com campos detectados e pendencias explicitas.

## Runner Canonico

Em maquina com a skill instalada pelo `setup`, priorizar este launcher:

- Windows: `CODEX_HOME/bin/sicc-codex.cmd`
- Shell POSIX: `CODEX_HOME/bin/sicc-codex`

Se o launcher ainda nao existir, usar fallback sem install global:

- `npx --yes sicc-codex-toolkit@latest`

## Preflight de Instalacao

Antes do primeiro uso em uma maquina nova:

1. Garantir Node.js 20 ou superior.
2. Rodar `npx --yes sicc-codex-toolkit@latest setup` uma vez para instalar skill, launcher e MCP.
3. Rodar `CODEX_HOME/bin/sicc-codex.cmd bootstrap-python` ou fallback `npx --yes sicc-codex-toolkit@latest bootstrap-python`.
4. Rodar o launcher `CODEX_HOME/bin/sicc-codex.cmd doctor` ou fallback `npx --yes sicc-codex-toolkit@latest doctor`.
5. Seguir o fluxo do cadastro.

No Windows, a instalacao recomendada do Node e:

- `winget install OpenJS.NodeJS.LTS`

Se usar `nvm`:

- `nvm install 24`
- `nvm use 24`

## Preflight no Shell do Codex

Antes de usar qualquer comando do toolkit em uma maquina nova, o agente deve validar o ambiente no shell do Codex nesta ordem:

1. Rodar `node -v`.
2. Se `node` nao existir ou vier abaixo da versao 20, instalar Node antes de continuar.
3. Rodar `npm -v`.
4. So depois seguir para `sicc-codex doctor` e `sicc-codex setup`.

Bootstrap recomendado no Windows dentro do shell do Codex:

- `winget install OpenJS.NodeJS.LTS`
- fechar e abrir o shell novamente
- `node -v`
- `npm -v`

Alternativa com `nvm`:

- `nvm install 24`
- `nvm use 24`
- `node -v`
- `npm -v`

## Fluxo Obrigatorio

1. Identificar se a entrada vem de texto direto ou documento.
2. Se vier de documento, rodar o launcher `sicc-codex draft-payload <arquivo>` ou fallback `npx --yes sicc-codex-toolkit@latest draft-payload <arquivo>`.
3. Resolver `tenant_id` e IDs obrigatorios via MCP.
4. Verificar duplicidade por numero do contrato, se houver.
5. Montar ou completar o payload final.
6. Executar `mcp__sicc__cadastrar_contrato_ata`.

## Ferramentas e Comandos

- `npx --yes sicc-codex-toolkit@latest setup`
- `sicc-codex bootstrap-python`
- `sicc-codex doctor`
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
- Se o ambiente ainda nao estiver pronto, priorizar `npx --yes sicc-codex-toolkit@latest setup`.
- Se a maquina ainda nao tiver extratores robustos, priorizar `sicc-codex bootstrap-python`.
- Se o comando `sicc-codex` nao existir, usar o launcher em `CODEX_HOME/bin` ou fallback `npx --yes sicc-codex-toolkit@latest`.
- Se `node -v` falhar no shell do Codex, instalar Node antes de qualquer outro passo.
- Para `.doc`, preferir sempre o extrator Python; o fallback Node sozinho nao e confiavel.
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
- Ler [instalacao](references/instalacao.md).
- Ler [payloads](references/payloads.md).
