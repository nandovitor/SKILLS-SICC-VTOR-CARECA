const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function parseMajor(version) {
  const match = String(version || "").match(/^v?(\d+)/);
  return match ? Number(match[1]) : null;
}

function resolveCodexHome(explicitCodexHome) {
  if (explicitCodexHome) return path.resolve(explicitCodexHome);
  if (process.env.CODEX_HOME) return path.resolve(process.env.CODEX_HOME);
  return path.join(os.homedir(), ".codex");
}

function runDoctor(options = {}) {
  const codexHome = resolveCodexHome(options.codexHome);
  const configPath = path.join(codexHome, "config.toml");
  const nodeMajor = parseMajor(process.version);
  const configContent = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";

  const checks = [
    {
      name: "node-version",
      ok: Number.isFinite(nodeMajor) && nodeMajor >= 20,
      actual: process.version,
      expected: ">= v20",
      fix: "Instale Node.js 20+ antes de usar o toolkit. No Windows: `winget install OpenJS.NodeJS.LTS`.",
    },
    {
      name: "codex-home",
      ok: fs.existsSync(codexHome),
      actual: codexHome,
      expected: "Diretorio do Codex existente",
      fix: "Instale/abra o Codex uma vez para criar a pasta base, ou informe `--codex-home`.",
    },
    {
      name: "codex-config",
      ok: fs.existsSync(configPath),
      actual: configPath,
      expected: "config.toml existente",
      fix: "Execute `sicc-codex setup` para criar ou atualizar o config.toml.",
    },
    {
      name: "mcp-sicc",
      ok: /\[mcp_servers\.sicc\][\s\S]*url\s*=\s*"https:\/\/compras\.app\.br\/mcp\/documentos"/m.test(configContent),
      actual: fs.existsSync(configPath) ? "Encontrado no config" : "Config ausente",
      expected: "Servidor MCP SICC configurado",
      fix: "Execute `sicc-codex setup` para registrar o MCP SICC.",
    },
    {
      name: "skills-dir",
      ok: fs.existsSync(path.join(codexHome, "skills")),
      actual: path.join(codexHome, "skills"),
      expected: "Diretorio de skills existente",
      fix: "Execute `sicc-codex setup` para instalar a skill.",
    },
  ];

  return {
    ok: checks.every((check) => check.ok),
    codexHome,
    checks,
  };
}

module.exports = {
  runDoctor,
  resolveCodexHome,
};
