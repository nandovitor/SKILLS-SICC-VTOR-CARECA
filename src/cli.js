const fs = require("node:fs");
const path = require("node:path");
const { Command } = require("commander");
const { runDoctor } = require("./doctor");
const { installCodexIntegration } = require("./install");
const { extractTextFromFile } = require("./extractors");
const { normalizeContractText } = require("./normalize");
const { buildDraftPayload, buildFinalPayload } = require("./payload");

function writeJsonOutput(data, outputPath) {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  if (outputPath) {
    fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
    fs.writeFileSync(path.resolve(outputPath), text, "utf8");
    return;
  }
  process.stdout.write(text);
}

async function runCli(argv = process.argv) {
  const program = new Command();

  program
    .name("sicc-codex")
    .description("Instala a skill do SICC no Codex e transforma documentos em payload de cadastro.")
    .version("0.1.0");

  program
    .command("doctor")
    .description("Valida Node, CODEX_HOME, config.toml e registro do MCP SICC.")
    .option("--codex-home <path>", "Diretorio base do Codex")
    .option("--output <file>", "Salvar JSON em arquivo")
    .action((options) => {
      const result = runDoctor(options);
      writeJsonOutput(result, options.output);
      if (!result.ok) {
        process.exitCode = 1;
      }
    });

  program
    .command("setup")
    .description("Instala a skill no CODEX_HOME/.codex e registra o MCP SICC no config.toml.")
    .option("--codex-home <path>", "Diretorio base do Codex")
    .option("--mcp-url <url>", "URL do MCP do SICC", "https://compras.app.br/mcp/documentos")
    .option("--server-name <name>", "Nome do servidor MCP no config", "sicc")
    .action((options) => {
      const result = installCodexIntegration(options);
      writeJsonOutput(result);
      if (!result.ok) {
        process.exitCode = 1;
      }
    });

  program
    .command("extract")
    .description("Extrai texto de PDF, DOCX, TXT ou MD.")
    .argument("<file>", "Arquivo de entrada")
    .option("--output <file>", "Salvar JSON em arquivo")
    .action(async (file, options) => {
      const extracted = await extractTextFromFile(file);
      writeJsonOutput(extracted, options.output);
    });

  program
    .command("draft-payload")
    .description("Extrai e normaliza um documento em um rascunho de payload do SICC.")
    .argument("<file>", "Arquivo PDF, DOCX, TXT ou MD")
    .option("--output <file>", "Salvar JSON em arquivo")
    .action(async (file, options) => {
      const extracted = await extractTextFromFile(file);
      const normalized = normalizeContractText(extracted.text, { sourceFile: extracted.filePath });
      const draft = buildDraftPayload(normalized);
      writeJsonOutput(draft, options.output);
    });

  program
    .command("build-payload")
    .description("Converte um JSON normalizado em payload final do SICC quando os IDs obrigatorios ja estiverem resolvidos.")
    .requiredOption("--input <file>", "JSON de entrada")
    .option("--output <file>", "Salvar JSON em arquivo")
    .action((options) => {
      const raw = JSON.parse(fs.readFileSync(path.resolve(options.input), "utf8"));
      const payload = buildFinalPayload(raw);
      writeJsonOutput(payload, options.output);
    });

  await program.parseAsync(argv);
}

module.exports = { runCli };
