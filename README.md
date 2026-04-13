# SKILLS-SICC-VTOR-CARECA

Toolkit Node para o fluxo de cadastro de contratos no SICC com Codex e MCP.

Ele resolve duas partes:

1. Instalar a skill `sicc-cadastrar-contrato` no Codex e registrar o MCP SICC no `config.toml`
2. Extrair PDF, DOCX, TXT ou MD e transformar o documento em rascunho de payload para cadastro

## Estrutura

- `bin/`: comando executavel `sicc-codex`
- `src/`: CLI, extracao, normalizacao, validacao e montagem do payload
- `templates/skills/sicc-cadastrar-contrato/`: skill pronta para ser instalada no Codex

## Instalacao completa e robusta

### 1. Instalar Node.js

Requisito minimo: Node.js 20 ou superior.

Windows com `winget`:

```bash
winget install OpenJS.NodeJS.LTS
```

Se voce usa `nvm`:

```bash
nvm install 24
nvm use 24
```

Validar:

```bash
node -v
npm -v
```

### 2. Instalar o toolkit

```bash
npm install
npm link
```

### 3. Validar ambiente

```bash
sicc-codex doctor
```

### 4. Instalar skill e MCP

```bash
sicc-codex setup
```

### 5. Fluxo rapido para contrato ou ARP

```bash
sicc-codex draft-payload contrato.pdf
```

Resolver no MCP:

- `tenant_id`
- `objeto_resumido_id`
- `unidade_gerenciadora_id`
- `unidades_participantes`
- `modalidade_id`

Fechar o payload:

```bash
sicc-codex build-payload --input contrato-normalizado.json
```

## Uso local

```bash
sicc-codex doctor
sicc-codex setup
sicc-codex draft-payload contrato.pdf
sicc-codex build-payload --input contrato-normalizado.json
```

## Uso em outro computador

Enquanto o pacote nao estiver publicado no npm, voce pode instalar direto do GitHub:

```bash
npx github:nandovitor/SKILLS-SICC-VTOR-CARECA setup
```

Depois de publicar no npm, o ideal fica:

```bash
npx sicc-codex-toolkit setup
```

## Resultado esperado

Depois do `setup`:

- a skill fica instalada em `CODEX_HOME/skills/sicc-cadastrar-contrato`
- o MCP SICC fica registrado em `CODEX_HOME/config.toml`
- o Codex passa a poder usar `$sicc-cadastrar-contrato` diretamente

## O que deixa a instalacao mais robusta

- `engines.node` exige Node 20+
- `.nvmrc` fixa a serie recomendada
- `sicc-codex doctor` checa Node, Codex e MCP antes do uso
- `setup` reinstala a skill e corrige o bloco do MCP SICC no `config.toml`
