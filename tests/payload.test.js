const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { normalizeContractText } = require("../src/normalize");
const { buildDraftPayload, buildFinalPayload } = require("../src/payload");

function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
}

test("buildDraftPayload monta o rascunho com hints e pendencias", () => {
  const normalized = normalizeContractText(readFixture("contrato-basico.txt"), {
    sourceFile: "contrato-basico.txt",
  });
  const draft = buildDraftPayload(normalized);

  assert.equal(draft.sourceFile, "contrato-basico.txt");
  assert.equal(draft.payloadDraft.tenant_id, null);
  assert.equal(draft.payloadDraft.documentos.length, 1);
  assert.equal(draft.payloadDraft.documentos[0].contrato_ata.numero, "123/2026");
  assert.equal(draft.payloadDraft.documentos[0].contrato_ata.objeto_resumido_id, null);
  assert.equal(draft.payloadDraft.documentos[0].contrato_ata.unidade_gerenciadora_id, null);
  assert.deepEqual(draft.payloadDraft.documentos[0].contrato_ata.unidades_participantes, []);
  assert.equal(draft.payloadDraft.documentos[0].fornecedor.cnpj_cpf, "12345678000199");
  assert.equal(draft.payloadDraft.documentos[0].licitacao.modalidade_id, null);
  assert.equal(draft.hints.modalidade_nome, "PREGAO ELETRONICO");
  assert.ok(draft.unresolved.includes("tenant_id"));
});

test("buildFinalPayload gera o formato final esperado", () => {
  const payload = buildFinalPayload({
    tenant_id: "tenant-demo",
    contrato_ata: {
      data: "2026-04-13",
      data_validade: "2027-04-13",
      numero: "123/2026",
      objeto: "Contratacao de servicos de limpeza predial para as unidades administrativas.",
      objeto_resumido_id: 10,
      tipo: "CONTRATO",
      unidade_gerenciadora_id: 5,
      unidades_participantes: [5, 9],
      valor: 100000,
    },
    fornecedor: {
      cnpj_cpf: "12.345.678/0001-99",
      razao_social: "EMPRESA EXEMPLO LTDA",
    },
    licitacao: {
      modalidade_id: 2,
      numero: "45/2026",
      numero_processo_adm: "2026.000123",
      objeto: "Contratacao de servicos de limpeza predial para as unidades administrativas.",
    },
    lotes: [
      {
        numero: "1",
        titulo: "Lote unico",
        itens: [
          {
            numero: "1",
            descricao: "Contratacao de servicos de limpeza predial para as unidades administrativas.",
            quantidade: 1,
            unidade_medida: "UN",
            valor_unitario: 100000,
          },
        ],
      },
    ],
  });

  assert.equal(payload.tenant_id, "tenant-demo");
  assert.equal(payload.documentos.length, 1);
  assert.equal(payload.documentos[0].fornecedor.cnpj_cpf, "12345678000199");
  assert.deepEqual(payload.documentos[0].contrato_ata.unidades_participantes, [5, 9]);
  assert.equal(payload.documentos[0].licitacao.modalidade_id, 2);
  assert.equal(payload.documentos[0].lotes.length, 1);
});

test("buildFinalPayload usa unidade gerenciadora quando participantes vier vazio", () => {
  const payload = buildFinalPayload({
    tenant_id: "tenant-demo",
    contrato_ata: {
      data: "2026-04-13",
      data_validade: "2027-04-13",
      numero: "123/2026",
      objeto: "Contratacao de servicos de limpeza predial para as unidades administrativas.",
      objeto_resumido_id: 10,
      tipo: "CONTRATO",
      unidade_gerenciadora_id: 5,
      unidades_participantes: [],
      valor: 100000,
    },
    fornecedor: {
      cnpj_cpf: "12345678000199",
      razao_social: "EMPRESA EXEMPLO LTDA",
    },
    licitacao: {
      modalidade_id: 2,
      numero: "45/2026",
      numero_processo_adm: "2026.000123",
      objeto: "Contratacao de servicos de limpeza predial para as unidades administrativas.",
    },
  });

  assert.deepEqual(payload.documentos[0].contrato_ata.unidades_participantes, [5]);
});
