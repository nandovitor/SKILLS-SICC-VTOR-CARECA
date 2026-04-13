# Instalacao

## Requisitos

- Node.js 20 ou superior
- npm funcional
- Codex instalado

## Windows

Instalacao recomendada do Node:

```bash
winget install OpenJS.NodeJS.LTS
```

Alternativa com `nvm`:

```bash
nvm install 24
nvm use 24
```

## Passos

1. Instalar o toolkit
2. Rodar `sicc-codex doctor`
3. Rodar `sicc-codex setup`
4. Reiniciar o Codex se ja estiver aberto

## Validacoes importantes

- `node -v` deve mostrar Node 20+
- `sicc-codex doctor` deve retornar `ok: true`
- `CODEX_HOME/config.toml` deve conter `[mcp_servers.sicc]`
- `CODEX_HOME/skills/sicc-cadastrar-contrato` deve existir

## Fluxo operacional robusto

1. Gerar rascunho com `sicc-codex draft-payload`
2. Resolver IDs via MCP
3. Validar o JSON final com `sicc-codex build-payload --input ...`
4. Executar `mcp__sicc__cadastrar_contrato_ata`
