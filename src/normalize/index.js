const {
  cleanText,
  normalizeForSearch,
  normalizeDate,
  parseBrazilianMoney,
  createLineEntries,
} = require("./utils");
const {
  detectContractNumber,
  detectLicitationNumber,
  detectProcessNumber,
  detectDate,
  detectCnpj,
  detectObject,
  detectSupplierName,
  detectModality,
  detectUnits,
  detectHighestMoney,
} = require("./detectors");
const {
  buildSingleLot,
  buildHints,
  buildUnresolved,
} = require("./builders");

function normalizeContractText(rawText, metadata = {}) {
  const text = cleanText(rawText);
  const searchableText = normalizeForSearch(text);
  const entries = createLineEntries(text);

  const contractNumber = detectContractNumber(searchableText);
  const licitationNumber = detectLicitationNumber(searchableText);
  const processNumber = detectProcessNumber(searchableText);
  const signedDate = detectDate(entries, [/\bdata\b/, /\bassinatura\b/]);
  const validityDate = detectDate(entries, [/\bvigencia\b/, /\bvalidade\b/, /\btermino\b/]);
  const cnpj = detectCnpj(text);
  const objectText = detectObject(entries);
  const supplierName = detectSupplierName(entries, cnpj);
  const modality = detectModality(searchableText);
  const units = detectUnits(entries);
  const totalValue = detectHighestMoney(entries);
  const hints = buildHints(objectText, modality, units);
  const unresolved = buildUnresolved([
    { path: "contrato_ata.data", ok: signedDate },
    { path: "contrato_ata.data_validade", ok: validityDate },
    { path: "contrato_ata.numero", ok: contractNumber },
    { path: "contrato_ata.objeto", ok: objectText },
    { path: "fornecedor.razao_social", ok: supplierName },
    { path: "fornecedor.cnpj_cpf", ok: cnpj },
    { path: "licitacao.numero", ok: licitationNumber },
    { path: "licitacao.numero_processo_adm", ok: processNumber },
    { path: "licitacao.modalidade_nome", ok: modality },
  ]);

  return {
    sourceFile: metadata.sourceFile || null,
    extractedText: text,
    normalized: {
      contrato_ata: {
        data: signedDate,
        data_validade: validityDate,
        numero: contractNumber,
        objeto: objectText,
        tipo: "CONTRATO",
        valor: totalValue,
      },
      fornecedor: {
        cnpj_cpf: cnpj ? cnpj.replace(/[^\d]/g, "") : null,
        razao_social: supplierName,
      },
      licitacao: {
        numero: licitationNumber,
        numero_processo_adm: processNumber,
        objeto: objectText,
      },
      lotes: buildSingleLot(objectText, totalValue),
      hints,
      unresolved,
    },
  };
}

module.exports = {
  normalizeContractText,
  normalizeDate,
  parseBrazilianMoney,
};
