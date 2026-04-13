const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runDoctor } = require("./doctor");
const { bootstrapPythonExtractors } = require("./extractors");

const TEMPLATE_ROOT = path.resolve(__dirname, "..", "templates", "skills", "sicc-cadastrar-contrato");
const MIN_NODE_MAJOR = 20;
const DEFAULT_PACKAGE_SPEC = "sicc-codex-toolkit@latest";
const CREATOR_NAME = "Fernando Luiz";

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

function ensureToolkitLaunchers(codexHome, packageSpec = DEFAULT_PACKAGE_SPEC) {
  const binDir = path.join(codexHome, "bin");
  const commandPath = path.join(binDir, "sicc-codex.cmd");
  const shellPath = path.join(binDir, "sicc-codex");
  const localToolkitRoot = path.join(codexHome, "toolkits", "sicc-codex-toolkit");
  const localEntryPoint = path.join(localToolkitRoot, "bin", "sicc-codex.js");
  const localEntryPointWindows = localEntryPoint.replace(/\//g, "\\");

  copyDirectory(path.resolve(__dirname, "..", "bin"), path.join(localToolkitRoot, "bin"));
  copyDirectory(path.resolve(__dirname), path.join(localToolkitRoot, "src"));
  fs.copyFileSync(
    path.resolve(__dirname, "..", "package.json"),
    path.join(localToolkitRoot, "package.json"),
  );
  fs.copyFileSync(
    path.resolve(__dirname, "..", "README.md"),
    path.join(localToolkitRoot, "README.md"),
  );
  const requirementsPath = path.resolve(__dirname, "..", "requirements-extractors.txt");
  if (fs.existsSync(requirementsPath)) {
    fs.copyFileSync(
      requirementsPath,
      path.join(localToolkitRoot, "requirements-extractors.txt"),
    );
  }
  copyDirectory(path.resolve(__dirname, "..", "templates"), path.join(localToolkitRoot, "templates"));

  const commandScript = [
    "@echo off",
    `set "SICC_CODEX_LOCAL=${localEntryPointWindows}"`,
    "if exist \"%SICC_CODEX_LOCAL%\" (",
    "  node \"%SICC_CODEX_LOCAL%\" %*",
    ") else (",
    `  npx --yes ${packageSpec} %*`,
    ")",
    "",
  ].join("\r\n");

  const shellScript = [
    "#!/usr/bin/env sh",
    `SICC_CODEX_LOCAL="${localEntryPoint}"`,
    "if [ -f \"$SICC_CODEX_LOCAL\" ]; then",
    "  node \"$SICC_CODEX_LOCAL\" \"$@\"",
    "else",
    `  npx --yes ${packageSpec} "$@"`,
    "fi",
    "",
  ].join("\n");

  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(commandPath, commandScript, "utf8");
  fs.writeFileSync(shellPath, shellScript, "utf8");

  return {
    binDir,
    commandPath,
    shellPath,
    localToolkitRoot,
    localEntryPoint,
    packageSpec,
  };
}

function installCodexIntegration(options = {}) {
  const nodeMajor = Number(String(process.version).replace(/^v(\d+).*$/, "$1"));
  if (!Number.isFinite(nodeMajor) || nodeMajor < MIN_NODE_MAJOR) {
    throw new Error(`Node.js ${MIN_NODE_MAJOR}+ e obrigatorio. Versao atual: ${process.version}`);
  }

  const codexHome = resolveCodexHome(options.codexHome);
  const skillTargetDir = path.join(codexHome, "skills", "sicc-cadastrar-contrato");
  const configPath = path.join(codexHome, "config.toml");
  const packageSpec = options.packageSpec || DEFAULT_PACKAGE_SPEC;

  copyDirectory(TEMPLATE_ROOT, skillTargetDir);
  const launchers = ensureToolkitLaunchers(codexHome, packageSpec);
  ensureMcpServerConfig(configPath, options.serverName || "sicc", options.mcpUrl || "https://compras.app.br/mcp/documentos");
  const pythonBootstrap = options.preparePython ? bootstrapPythonExtractors(options) : null;
  const doctor = runDoctor({ codexHome });

  return {
    ok: doctor.ok,
    createdBy: CREATOR_NAME,
    codexHome,
    installedSkill: skillTargetDir,
    updatedConfig: configPath,
    launcher: launchers,
    pythonBootstrap,
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
      toolkit: [
        launchers.commandPath,
        `${launchers.commandPath} doctor`,
        `${launchers.commandPath} draft-payload arquivo.pdf`,
      ],
      python: [
        `${launchers.commandPath} bootstrap-python`,
      ],
    },
    doctor,
    nextSteps: [
      "Reinicie o Codex se ele ja estava aberto.",
      "No shell do Codex em maquina nova, valide `node -v` e `npm -v` antes de usar o toolkit.",
      `Use o launcher em ${launchers.commandPath} para rodar o toolkit sem depender de install global.`,
      "Para extracao mais robusta de PDF/DOC/DOCX, rode `sicc-codex bootstrap-python`.",
      "Rode `sicc-codex doctor` ou o launcher equivalente para validar Node, Codex e MCP.",
      "Use $sicc-cadastrar-contrato para cadastrar contratos via MCP.",
      "Use `sicc-codex draft-payload arquivo.pdf` para gerar um rascunho antes do cadastro.",
    ],
  };
}

module.exports = {
  CREATOR_NAME,
  installCodexIntegration,
  resolveCodexHome,
};
