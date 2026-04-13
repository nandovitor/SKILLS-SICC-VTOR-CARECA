const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runDoctor } = require("./doctor");

const TEMPLATE_ROOT = path.resolve(__dirname, "..", "templates", "skills", "sicc-cadastrar-contrato");
const MIN_NODE_MAJOR = 20;

function resolveCodexHome(explicitCodexHome) {
  if (explicitCodexHome) return path.resolve(explicitCodexHome);
  if (process.env.CODEX_HOME) return path.resolve(process.env.CODEX_HOME);
  return path.join(os.homedir(), ".codex");
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function ensureMcpServerConfig(configPath, serverName, url) {
  const blockLines = [
    `[mcp_servers.${serverName}]`,
    "enabled = true",
    `url = "${url}"`,
  ];

  const content = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";
  const lines = content ? content.split(/\r?\n/) : [];
  const output = [];
  let found = false;
  let inTargetSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === `[mcp_servers.${serverName}]`) {
      if (!found) {
        output.push(...blockLines);
        found = true;
      }
      inTargetSection = true;
      continue;
    }

    if (inTargetSection) {
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        inTargetSection = false;
        output.push(line);
      }
      continue;
    }

    output.push(line);
  }

  if (!found) {
    if (output.length && output[output.length - 1] !== "") {
      output.push("");
    }
    output.push(...blockLines);
  }

  const normalizedContent = `${output.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, normalizedContent, "utf8");
  return configPath;
}

function installCodexIntegration(options = {}) {
  const nodeMajor = Number(String(process.version).replace(/^v(\d+).*$/, "$1"));
  if (!Number.isFinite(nodeMajor) || nodeMajor < MIN_NODE_MAJOR) {
    throw new Error(`Node.js ${MIN_NODE_MAJOR}+ e obrigatorio. Versao atual: ${process.version}`);
  }

  const codexHome = resolveCodexHome(options.codexHome);
  const skillTargetDir = path.join(codexHome, "skills", "sicc-cadastrar-contrato");
  const configPath = path.join(codexHome, "config.toml");

  copyDirectory(TEMPLATE_ROOT, skillTargetDir);
  ensureMcpServerConfig(configPath, options.serverName || "sicc", options.mcpUrl || "https://compras.app.br/mcp/documentos");
  const doctor = runDoctor({ codexHome });

  return {
    ok: doctor.ok,
    codexHome,
    installedSkill: skillTargetDir,
    updatedConfig: configPath,
    shellBootstrap: {
      check: [
        "node -v",
        "npm -v",
      ],
      windows: [
        "winget install OpenJS.NodeJS.LTS",
        "node -v",
        "npm -v",
      ],
      windowsNvm: [
        "nvm install 24",
        "nvm use 24",
        "node -v",
        "npm -v",
      ],
    },
    doctor,
    nextSteps: [
      "Reinicie o Codex se ele ja estava aberto.",
      "No shell do Codex em maquina nova, valide `node -v` e `npm -v` antes de usar o toolkit.",
      "Rode `sicc-codex doctor` para validar Node, Codex e MCP.",
      "Use $sicc-cadastrar-contrato para cadastrar contratos via MCP.",
      "Use `sicc-codex draft-payload arquivo.pdf` para gerar um rascunho antes do cadastro.",
    ],
  };
}

module.exports = {
  installCodexIntegration,
  resolveCodexHome,
};
