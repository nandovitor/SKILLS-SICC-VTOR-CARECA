const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { installCodexIntegration } = require("../src/install");

test("setup cria skill, config e launchers do toolkit", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sicc-codex-"));

  try {
    const result = installCodexIntegration({ codexHome: tempRoot });
    const commandPath = path.join(tempRoot, "bin", "sicc-codex.cmd");
    const shellPath = path.join(tempRoot, "bin", "sicc-codex");
    const configPath = path.join(tempRoot, "config.toml");
    const skillPath = path.join(tempRoot, "skills", "sicc-cadastrar-contrato", "SKILL.md");
    const localToolkitRoot = path.join(tempRoot, "toolkits", "sicc-codex-toolkit");
    const localEntryPoint = path.join(localToolkitRoot, "bin", "sicc-codex.js");

    assert.equal(result.ok, true);
    assert.equal(result.createdBy, "Fernando Luiz");
    assert.equal(result.installedSkill, path.join(tempRoot, "skills", "sicc-cadastrar-contrato"));
    assert.equal(result.launcher.commandPath, commandPath);
    assert.equal(result.launcher.shellPath, shellPath);
    assert.equal(result.launcher.localToolkitRoot, localToolkitRoot);
    assert.equal(result.launcher.localEntryPoint, localEntryPoint);
    assert.equal(result.launcher.packageSpec, "sicc-codex-toolkit@latest");
    assert.equal(fs.existsSync(commandPath), true);
    assert.equal(fs.existsSync(shellPath), true);
    assert.equal(fs.existsSync(configPath), true);
    assert.equal(fs.existsSync(skillPath), true);
    assert.equal(fs.existsSync(localEntryPoint), true);
    assert.match(fs.readFileSync(commandPath, "utf8"), /if exist "%SICC_CODEX_LOCAL%"/);
    assert.match(fs.readFileSync(commandPath, "utf8"), /node "%SICC_CODEX_LOCAL%" %\*/);
    assert.match(fs.readFileSync(commandPath, "utf8"), /npx --yes sicc-codex-toolkit@latest %\*/);
    assert.match(fs.readFileSync(shellPath, "utf8"), /if \[ -f "\$SICC_CODEX_LOCAL" \]/);
    assert.match(fs.readFileSync(shellPath, "utf8"), /node "\$SICC_CODEX_LOCAL" "\$@"/);
    assert.match(fs.readFileSync(shellPath, "utf8"), /npx --yes sicc-codex-toolkit@latest "\$@"/);
    assert.match(fs.readFileSync(configPath, "utf8"), /\[mcp_servers\.sicc\]/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
