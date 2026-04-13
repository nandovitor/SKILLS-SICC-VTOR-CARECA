# SKILLS-SICC-VTOR-CARECA

Toolkit Node para o fluxo de cadastro de contratos no SICC com Codex e MCP.

Ele resolve duas partes:

1. Instalar a skill `sicc-cadastrar-contrato` no Codex e registrar o MCP SICC no `config.toml`
2. Extrair PDF, DOCX, TXT ou MD e transformar o documento em rascunho de payload para cadastro

## Estrutura

- `bin/`: comando executavel `sicc-codex`
- `src/`: CLI, extracao, normalizacao, validacao e montagem do payload
- `templates/skills/sicc-cadastrar-contrato/`: skill pronta para ser instalada no Codex

## Uso local

```bash
npm install
npm link
sicc-codex setup
sicc-codex draft-payload contrato.pdf
sicc-codex build-payload --input contrato-normalizado.json
```

## Uso em outro computador

 instalar direto do GitHub:

```bash
npx github:nandovitor/SKILLS-SICC-VTOR-CARECA setup
```

Depois que eu publcar no NPM fica assim

```bash
npx sicc-codex-toolkit setup
```

## Espero que fiique assim

Depois do `setup`:

- a skill fica instalada em `CODEX_HOME/skills/sicc-cadastrar-contrato`
- o MCP SICC fica registrado em `CODEX_HOME/config.toml`
- o Codex passa a poder usar `$sicc-cadastrar-contrato` diretamente
