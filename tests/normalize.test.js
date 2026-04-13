const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  normalizeContractText,
  normalizeDate,
  parseBrazilianMoney,
} = require("../src/normalize");

function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
}

test("normalizeDate converte dd/mm/aaaa para aaaa-mm-dd", () => {
  assert.equal(normalizeDate("13/04/2026"), "2026-04-13");
  assert.equal(normalizeDate("texto invalido"), null);
});

test("parseBrazilianMoney interpreta valores brasileiros", () => {
  assert.equal(parseBrazilianMoney("R$ 100.000,00"), 100000);
  assert.equal(parseBrazilianMoney("12.500,00"), 12500);
  assert.equal(parseBrazilianMoney("abc"), null);
});

test("normaliza um contrato basico com os campos principais", () => {
  const result = normalizeContractText(readFixture("contrato-basico.txt"), {
    sourceFile: "contrato-basico.txt",
  });

  assert.equal(result.sourceFile, "contrato-basico.txt");
  assert.equal(result.normalized.contrato_ata.numero, "123/2026");
  assert.equal(result.normalized.contrato_ata.data, "2026-04-13");
  assert.equal(result.normalized.contrato_ata.data_validade, "2027-04-13");
  assert.equal(result.normalized.contrato_ata.valor, 100000);
  assert.equal(
    result.normalized.contrato_ata.objeto,
    "Contratacao de servicos de limpeza predial para as unidades administrativas."
  );
  assert.equal(result.normalized.fornecedor.razao_social, "EMPRESA EXEMPLO LTDA");
  assert.equal(result.normalized.fornecedor.cnpj_cpf, "12345678000199");
  assert.equal(result.normalized.licitacao.numero, "45/2026");
  assert.equal(result.normalized.licitacao.numero_processo_adm, "2026.000123");
  assert.equal(result.normalized.hints.modalidade_nome, "PREGAO ELETRONICO");
  assert.deepEqual(result.normalized.hints.unidades_participantes_nomes, ["SECRETARIA DE ADMINISTRACAO"]);
  assert.ok(result.normalized.unresolved.includes("tenant_id"));
});

test("escolhe o valor principal do contrato e ignora multa menor", () => {
  const result = normalizeContractText(readFixture("contrato-com-multa.txt"));

  assert.equal(result.normalized.contrato_ata.numero, "77/2026");
  assert.equal(result.normalized.contrato_ata.valor, 250000);
  assert.equal(
    result.normalized.contrato_ata.objeto,
    "Contratacao de empresa para manutencao preventiva e corretiva de elevadores."
  );
  assert.equal(result.normalized.fornecedor.razao_social, "ELEVADORES BRASIL SERVICOS LTDA");
  assert.equal(result.normalized.licitacao.numero, "12/2026");
  assert.equal(result.normalized.licitacao.numero_processo_adm, "2026/4455");
  assert.deepEqual(result.normalized.hints.unidades_participantes_nomes, [
    "PREFEITURA MUNICIPAL DE EXEMPLO",
    "SECRETARIA DE INFRAESTRUTURA",
  ]);
});

test("encontra objeto e fornecedor mesmo quando faltam labels fortes", () => {
  const result = normalizeContractText(readFixture("contrato-sem-labels-fortes.txt"));

  assert.equal(result.normalized.contrato_ata.data, "2026-02-20");
  assert.equal(result.normalized.contrato_ata.data_validade, "2027-02-20");
  assert.equal(result.normalized.contrato_ata.valor, 80000);
  assert.match(result.normalized.contrato_ata.objeto, /apoio tecnico e operacional/i);
  assert.equal(result.normalized.fornecedor.razao_social, "ALFA APOIO OPERACIONAL LTDA");
  assert.equal(result.normalized.fornecedor.cnpj_cpf, "11222333000144");
  assert.equal(result.normalized.licitacao.numero, "19/2026");
  assert.equal(result.normalized.licitacao.numero_processo_adm, "2026-8891");
  assert.deepEqual(result.normalized.hints.unidades_participantes_nomes, [
    "Gabinete do Prefeito",
    "Secretaria de Governo",
  ]);
  assert.ok(result.normalized.unresolved.includes("licitacao.modalidade_nome"));
});
