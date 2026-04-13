# SKILLS-SICC-VTOR-CARECA

Esse repo junta o que precisa para deixar o fluxo do SICC mais redondo no Codex.

A ideia aqui e simples: parar de perder tempo toda vez montando tudo do zero, instalando dependencia no meio da tarefa ou tentando adivinhar payload. O pacote instala a skill, configura o MCP e ainda ajuda a ler PDF ou DOCX para transformar o documento em um rascunho de cadastro.

## O que tem aqui

- `bin/`: o comando `sicc-codex`
- `src/`: a logica de extracao, normalizacao, validacao e montagem do payload
- `templates/skills/sicc-cadastrar-contrato/`: a skill pronta para o Codex instalar

## Antes de tudo

Voce vai precisar de Node.js 20 ou superior.

Em qualquer computador novo, a validacao deve acontecer primeiro no shell do Codex:

```bash
node -v
npm -v
```

Se `node` nao existir, instale antes de continuar com `doctor` ou `setup`.

Em maquina nova, o fluxo mais rapido e:

```bash
npx --yes sicc-codex-toolkit@latest setup
```

Isso instala a skill, registra o MCP e cria launchers em `CODEX_HOME/bin` para usar `sicc-codex` sem install global manual.

Se estiver no Windows, o caminho mais tranquilo e:

```bash
winget install OpenJS.NodeJS.LTS
```

Se voce curte `nvm`, tambem funciona:

```bash
nvm install 24
nvm use 24
```

Pra checar:

```bash
node -v
npm -v
```

## Instalando localmente

Dentro do repo:

```bash
npm install
npm link
```

## Abrindo no VS Code

Para evitar confusao com a pasta pai `Skill`, abra este repo pelo arquivo:

```bash
SKILLS-SICC-VTOR-CARECA.code-workspace
```

Ou abra diretamente a pasta:

```bash
C:\Users\Fernando Suporte\Documents\Skill\SKILLS-SICC-VTOR-CARECA
```

Para validar o pacote antes de mexer em feature:

```bash
npm run verify
```

Depois disso, roda:

```bash
sicc-codex doctor
```

Se estiver tudo certo, manda:

```bash
sicc-codex setup
```

Esse comando instala a skill no Codex e garante que o MCP do SICC fique no `config.toml`.

## Fluxo rapido

Se voce tiver um contrato, ata ou ARP em PDF, DOCX, TXT ou MD, pode comecar assim:

```bash
sicc-codex draft-payload contrato.pdf
```

Se quiser enxergar exatamente o que a normalizacao detectou antes de mexer nas heuristicas:

```bash
sicc-codex debug-normalize contrato.pdf
```

Isso gera um rascunho com bastante coisa preenchida e mostra o que ainda falta resolver no MCP, normalmente:

- `tenant_id`
- `objeto_resumido_id`
- `unidade_gerenciadora_id`
- `unidades_participantes`
- `modalidade_id`

Depois que esses IDs estiverem certos, fecha o payload final com:

```bash
sicc-codex build-payload --input contrato-normalizado.json
```

## Em outra maquina

Enquanto nao estiver publicado no npm, da pra usar direto pelo GitHub:

```bash
npx github:nandovitor/SKILLS-SICC-VTOR-CARECA setup
```

Quando publicar no npm, fica ainda mais facil:

```bash
npx sicc-codex-toolkit setup
```

## O que esperar no final

Depois do `setup`, o esperado e:

- a skill estar em `CODEX_HOME/skills/sicc-cadastrar-contrato`
- o MCP SICC estar registrado em `CODEX_HOME/config.toml`
- o Codex conseguir usar `$sicc-cadastrar-contrato` direto

## O que deixa isso mais confiavel

- Node minimo definido no projeto
- `.nvmrc` pra fixar a versao recomendada
- `sicc-codex doctor` pra checar ambiente antes de usar
- `setup` que reinstala a skill e corrige a config do MCP se precisar
- `.gitignore` e `.gitattributes` alinhados com o fluxo Node do repo
- `npm run verify` para smoke test e checagem de empacotamento

## Ponto de Partida Para Evoluir

Hoje o repo esta pronto para trabalhar em cima de tres frentes:

- melhorar as heuristicas de extracao em `src/normalize.js`
- adicionar novos comandos ao CLI em `src/cli.js`
- reforcar validacao, empacotamento e testes para publicar com mais seguranca
