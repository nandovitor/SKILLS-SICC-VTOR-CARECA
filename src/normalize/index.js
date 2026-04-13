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

function collectNormalizationState(rawText, metadata = {}) {
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
    text,
    entries,
    detections: {
      contractNumber,
      licitationNumber,
      processNumber,
      signedDate,
      validityDate,
      cnpj,
      objectText,
      supplierName,
      modality,
      units,
      totalValue,
    },
    hints,
    unresolved,
  };
}

function normalizeContractText(rawText, metadata = {}) {
  const state = collectNormalizationState(rawText, metadata);

  return {
    sourceFile: state.sourceFile,
    extractedText: state.text,
    normalized: {
      contrato_ata: {
        data: state.detections.signedDate,
        data_validade: state.detections.validityDate,
        numero: state.detections.contractNumber,
        objeto: state.detections.objectText,
        tipo: "CONTRATO",
        valor: state.detections.totalValue,
      },
      fornecedor: {
        cnpj_cpf: state.detections.cnpj ? state.detections.cnpj.replace(/[^\d]/g, "") : null,
        razao_social: state.detections.supplierName,
      },
      licitacao: {
        numero: state.detections.licitationNumber,
        numero_processo_adm: state.detections.processNumber,
        objeto: state.detections.objectText,
      },
      lotes: buildSingleLot(state.detections.objectText, state.detections.totalValue),
      hints: state.hints,
      unresolved: state.unresolved,
    },
  };
}

function debugContractText(rawText, metadata = {}) {
  const state = collectNormalizationState(rawText, metadata);
  const normalizedResult = normalizeContractText(rawText, metadata);

  return {
    sourceFile: state.sourceFile,
    summary: {
      lines: state.entries.length,
      unresolvedCount: state.unresolved.length,
      hasRequiredCoreFields: Boolean(
        state.detections.contractNumber &&
        state.detections.objectText &&
        state.detections.supplierName &&
        state.detections.cnpj
      ),
    },
    detections: {
      contrato_ata: {
        numero: {
          value: state.detections.contractNumber,
          status: state.detections.contractNumber ? "detected" : "missing",
        },
        data: {
          value: state.detections.signedDate,
          status: state.detections.signedDate ? "detected" : "missing",
        },
        data_validade: {
          value: state.detections.validityDate,
          status: state.detections.validityDate ? "detected" : "missing",
        },
        objeto: {
          value: state.detections.objectText,
          status: state.detections.objectText ? "detected" : "missing",
        },
        valor: {
          value: state.detections.totalValue,
          status: Number.isFinite(state.detections.totalValue) ? "detected" : "missing",
        },
      },
      fornecedor: {
        cnpj_cpf: {
          value: state.detections.cnpj ? state.detections.cnpj.replace(/[^\d]/g, "") : null,
          status: state.detections.cnpj ? "detected" : "missing",
        },
        razao_social: {
          value: state.detections.supplierName,
          status: state.detections.supplierName ? "detected" : "missing",
        },
      },
      licitacao: {
        numero: {
          value: state.detections.licitationNumber,
          status: state.detections.licitationNumber ? "detected" : "missing",
        },
        numero_processo_adm: {
          value: state.detections.processNumber,
          status: state.detections.processNumber ? "detected" : "missing",
        },
        modalidade_nome: {
          value: state.detections.modality,
          status: state.detections.modality ? "detected" : "missing",
        },
      },
      unidades: {
        unidade_gerenciadora_nome: {
          value: state.detections.units.primary,
          status: state.detections.units.primary ? "detected" : "missing",
        },
        unidades_participantes_nomes: {
          value: state.detections.units.participants,
          status: state.detections.units.participants.length ? "detected" : "missing",
        },
      },
    },
    hints: state.hints,
    unresolved: state.unresolved,
    normalizedPreview: normalizedResult.normalized,
  };
}

module.exports = {
  normalizeContractText,
  debugContractText,
  normalizeDate,
  parseBrazilianMoney,
};
