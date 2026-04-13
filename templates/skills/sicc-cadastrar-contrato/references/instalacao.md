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
3. Rodar `npx --yes sicc-codex-toolkit@latest setup`
4. Usar o launcher criado em `CODEX_HOME/bin/sicc-codex.cmd` ou `CODEX_HOME/bin/sicc-codex`
5. Rodar `sicc-codex bootstrap-python`
6. Rodar `sicc-codex doctor`
7. Reiniciar o Codex se ja estiver aberto

## Validacoes importantes

- `node -v` deve mostrar Node 20+
- `npm -v` deve responder normalmente
- o setup deve exibir `Skill Criada Por Fernando Luiz`
- `CODEX_HOME/bin/sicc-codex.cmd` ou `CODEX_HOME/bin/sicc-codex` deve existir
- `CODEX_HOME/toolkits/sicc-codex-toolkit/bin/sicc-codex.js` deve existir
- `sicc-codex bootstrap-python` deve concluir com `ok: true`
- `sicc-codex doctor` deve retornar `ok: true`
- `CODEX_HOME/config.toml` deve conter `[mcp_servers.sicc]`
- `CODEX_HOME/skills/sicc-cadastrar-contrato` deve existir

## Fluxo operacional robusto

1. Gerar rascunho com `sicc-codex draft-payload`
2. Resolver IDs via MCP
3. Validar o JSON final com `sicc-codex build-payload --input ...`
4. Executar `mcp__sicc__cadastrar_contrato_ata`
