const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

const PYTHON_REQUIREMENTS_PATH = path.resolve(__dirname, "..", "requirements-extractors.txt");

function getPythonHelperPath() {
  return process.env.SICC_CODEX_PYTHON_HELPER
    ? path.resolve(process.env.SICC_CODEX_PYTHON_HELPER)
    : path.resolve(__dirname, "python", "extract_text.py");
}

function normalizeExtractedText(text) {
  return String(text || "").replace(/\r\n/g, "\n").trim();
}

function getPythonCandidates(explicitPython) {
  if (process.env.SICC_CODEX_DISABLE_PYTHON === "1") return [];

  if (explicitPython) {
    return [{ command: explicitPython, args: [] }];
  }

  if (process.env.SICC_CODEX_PYTHON_BIN) {
    return [{ command: process.env.SICC_CODEX_PYTHON_BIN, args: [] }];
  }

  if (process.platform === "win32") {
    return [
      { command: "python", args: [] },
      { command: "py", args: ["-3"] },
      { command: "py", args: [] },
    ];
  }

  return [
    { command: "python3", args: [] },
    { command: "python", args: [] },
  ];
}

function resolvePythonCommand(explicitPython) {
  for (const candidate of getPythonCandidates(explicitPython)) {
    const probe = spawnSync(candidate.command, [...candidate.args, "--version"], {
      encoding: "utf8",
      windowsHide: true,
    });

    if (probe.status === 0) {
      return candidate;
    }
  }

  return null;
}

function runPythonHelper(filePath, explicitPython) {
  const python = resolvePythonCommand(explicitPython);
  if (!python) {
    return {
      ok: false,
      reason: "python-unavailable",
      error: "Python nao encontrado no ambiente.",
    };
  }

  const result = spawnSync(
    python.command,
    [...python.args, getPythonHelperPath(), filePath],
    {
      encoding: "utf8",
      windowsHide: true,
    }
  );

  if (result.status !== 0) {
    return {
      ok: false,
      reason: "python-helper-failed",
      error: (result.stderr || result.stdout || "Falha ao executar helper Python.").trim(),
    };
  }

  try {
    const parsed = JSON.parse(result.stdout || "{}");
    if (!parsed.ok) {
      return {
        ok: false,
        reason: "python-extractor-failed",
        error: parsed.error || "Helper Python nao conseguiu extrair o arquivo.",
        details: parsed.details || null,
      };
    }

    return {
      ok: true,
      engine: parsed.engine || "python",
      text: normalizeExtractedText(parsed.text),
    };
  } catch (error) {
    return {
      ok: false,
      reason: "python-helper-invalid-json",
      error: error.message,
    };
  }
}

function extractTextFromAntiword(filePath) {
  const result = spawnSync("antiword", [filePath], {
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status !== 0) {
    return {
      ok: false,
      error: (result.stderr || result.stdout || "Falha ao executar antiword.").trim(),
    };
  }

  return {
    ok: true,
    engine: "antiword",
    text: normalizeExtractedText(result.stdout),
  };
}

async function extractTextFromExcel(filePath, options = {}) {
  const pythonResult = runPythonHelper(filePath, options.python);
  if (pythonResult.ok) return pythonResult.text;

  throw new Error(
    [
      "Nao foi possivel extrair planilha com os extratores disponiveis.",
      "Para maquina nova, rode `sicc-codex bootstrap-python` para preparar XLS/XLSX.",
    ].join(" ")
  );
}

async function extractTextFromPdf(filePath, options = {}) {
  const pythonResult = runPythonHelper(filePath, options.python);
  if (pythonResult.ok) return pythonResult.text;

  const buffer = fs.readFileSync(filePath);
  const result = await pdfParse(buffer);
  return normalizeExtractedText(result.text || "");
}

async function extractTextFromDocx(filePath, options = {}) {
  const pythonResult = runPythonHelper(filePath, options.python);
  if (pythonResult.ok) return pythonResult.text;

  const result = await mammoth.extractRawText({ path: filePath });
  return normalizeExtractedText(result.value || "");
}

async function extractTextFromDoc(filePath, options = {}) {
  const pythonResult = runPythonHelper(filePath, options.python);
  if (pythonResult.ok) return pythonResult.text;

  const antiwordResult = extractTextFromAntiword(filePath);
  if (antiwordResult.ok) return antiwordResult.text;

  throw new Error(
    [
      "Nao foi possivel extrair .doc com os extratores disponiveis.",
      "Para maquina nova, rode `sicc-codex bootstrap-python` para preparar PDF/DOC/DOCX.",
      "Se o arquivo continuar falhando, instale Word com pywin32 ou uma ferramenta como antiword/libreoffice.",
    ].join(" ")
  );
}

async function extractTextFromFile(inputPath, options = {}) {
  const filePath = path.resolve(inputPath);
  const extension = path.extname(filePath).toLowerCase();

  let text;
  if (extension === ".pdf") {
    text = await extractTextFromPdf(filePath, options);
  } else if (extension === ".docx") {
    text = await extractTextFromDocx(filePath, options);
  } else if (extension === ".doc") {
    text = await extractTextFromDoc(filePath, options);
  } else if (extension === ".xls" || extension === ".xlsx") {
    text = await extractTextFromExcel(filePath, options);
  } else if (extension === ".txt" || extension === ".md" || extension === ".json") {
    text = fs.readFileSync(filePath, "utf8");
  } else {
    throw new Error(`Formato nao suportado: ${extension || "sem extensao"}`);
  }

  return {
    filePath,
    extension,
    text: normalizeExtractedText(text),
  };
}

function bootstrapPythonExtractors(options = {}) {
  const python = resolvePythonCommand(options.python);

  if (!python) {
    return {
      ok: false,
      error: "Python nao encontrado. Instale Python 3 antes de preparar os extratores.",
      suggestedCommands: process.platform === "win32"
        ? [
            "winget install Python.Python.3.11",
            "python --version",
          ]
        : [
            "python3 --version",
          ],
    };
  }

  const upgradePip = spawnSync(
    python.command,
    [...python.args, "-m", "pip", "install", "--upgrade", "pip"],
    { encoding: "utf8", windowsHide: true }
  );

  if (upgradePip.status !== 0) {
    return {
      ok: false,
      error: (upgradePip.stderr || upgradePip.stdout || "Falha ao atualizar pip.").trim(),
    };
  }

  const install = spawnSync(
    python.command,
    [...python.args, "-m", "pip", "install", "-r", PYTHON_REQUIREMENTS_PATH],
    { encoding: "utf8", windowsHide: true }
  );

  if (install.status !== 0) {
    return {
      ok: false,
      error: (install.stderr || install.stdout || "Falha ao instalar dependencias Python.").trim(),
    };
  }

  return {
    ok: true,
    python: [python.command, ...python.args].join(" ").trim(),
    requirements: PYTHON_REQUIREMENTS_PATH,
    installedPackages: [
      "pypdf",
      "python-docx",
      "openpyxl",
      "xlrd",
      "pywin32 (Windows)",
      "textract (opcional para .doc)",
    ],
  };
}

module.exports = {
  extractTextFromFile,
  extractTextFromPdf,
  extractTextFromDocx,
  extractTextFromDoc,
  extractTextFromExcel,
  bootstrapPythonExtractors,
  resolvePythonCommand,
};
