const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { extractTextFromFile } = require("../src/extractors");

function withEnv(pairs, fn) {
  const previous = new Map();

  for (const [key, value] of Object.entries(pairs)) {
    previous.set(key, process.env[key]);
    process.env[key] = value;
  }

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of previous.entries()) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    });
}

test("extrai texto bruto de arquivo txt", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sicc-extract-"));
  const filePath = path.join(tempDir, "sample.txt");

  try {
    fs.writeFileSync(filePath, "linha 1\r\nlinha 2\r\n", "utf8");
    const result = await extractTextFromFile(filePath);
    assert.equal(result.extension, ".txt");
    assert.equal(result.text, "linha 1\nlinha 2");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("usa helper externo para extrair .doc legado", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sicc-doc-"));
  const filePath = path.join(tempDir, "legacy.doc");
  const fakeHelper = path.join(__dirname, "helpers", "fake_python_helper.js");

  try {
    fs.writeFileSync(filePath, "binario-doc-legado", "utf8");

    const result = await withEnv(
      {
        SICC_CODEX_PYTHON_BIN: "node",
        SICC_CODEX_PYTHON_HELPER: fakeHelper,
      },
      () => extractTextFromFile(filePath)
    );

    assert.equal(result.extension, ".doc");
    assert.match(result.text, /DOC legado extraido com helper fake/i);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("erro de .doc sem helper orienta bootstrap python", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sicc-doc-"));
  const filePath = path.join(tempDir, "legacy.doc");

  try {
    fs.writeFileSync(filePath, "binario-doc-legado", "utf8");

    await assert.rejects(
      withEnv(
        {
          SICC_CODEX_DISABLE_PYTHON: "1",
        },
        () => extractTextFromFile(filePath)
      ),
      /bootstrap-python/
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("usa helper externo para extrair .xlsx", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sicc-xlsx-"));
  const filePath = path.join(tempDir, "planilha.xlsx");
  const fakeHelper = path.join(__dirname, "helpers", "fake_python_helper.js");

  try {
    fs.writeFileSync(filePath, "binario-xlsx", "utf8");

    const result = await withEnv(
      {
        SICC_CODEX_PYTHON_BIN: "node",
        SICC_CODEX_PYTHON_HELPER: fakeHelper,
      },
      () => extractTextFromFile(filePath)
    );

    assert.equal(result.extension, ".xlsx");
    assert.match(result.text, /\[sheet\] Planilha/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
