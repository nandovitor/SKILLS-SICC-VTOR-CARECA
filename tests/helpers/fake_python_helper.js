#!/usr/bin/env node

const path = require("node:path");

const filePath = process.argv[2] || "";
const extension = path.extname(filePath).toLowerCase();

if (extension === ".doc") {
  process.stdout.write(JSON.stringify({
    ok: true,
    engine: "fake-python-doc",
    text: "CONTRATO N° 55/2026\nOBJETO: Documento DOC legado extraido com helper fake.",
  }));
  process.exit(0);
}

if (extension === ".xls" || extension === ".xlsx") {
  process.stdout.write(JSON.stringify({
    ok: true,
    engine: "fake-python-excel",
    text: "[sheet] Planilha\nnumero | descricao | valor\n1 | item de planilha | 1000",
  }));
  process.exit(0);
}

process.stdout.write(JSON.stringify({
  ok: false,
  error: "Formato nao tratado pelo helper fake.",
}));
process.exit(1);
