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

Depois da instalacao:

```bash
node -v
npm -v
```

Alternativa com `nvm`:

```bash
nvm install 24
nvm use 24
```

## Passos

1. Validar `node -v` e `npm -v` no shell do Codex
2. Instalar Node se necessario
3. Instalar o toolkit
4. Rodar `sicc-codex doctor`
5. Rodar `sicc-codex setup`
6. Reiniciar o Codex se ja estiver aberto

## Validacoes importantes

- `node -v` deve mostrar Node 20+
- `npm -v` deve responder normalmente
- `sicc-codex doctor` deve retornar `ok: true`
- `CODEX_HOME/config.toml` deve conter `[mcp_servers.sicc]`
- `CODEX_HOME/skills/sicc-cadastrar-contrato` deve existir

## Fluxo operacional robusto

1. Gerar rascunho com `sicc-codex draft-payload`
2. Resolver IDs via MCP
3. Validar o JSON final com `sicc-codex build-payload --input ...`
4. Executar `mcp__sicc__cadastrar_contrato_ata`
