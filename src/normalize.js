const UNIT_KEYWORDS = /\b(secretaria|fundo municipal|prefeitura|camara|gabinete|autarquia)\b/i;
const OBJECT_KEYWORDS = /\b(servic|aquisic|contratac|locac|fornec|prestac|manutenc|apoio|operacional)\b/i;
const MODALITY_PATTERNS = [
  { label: "PREGAO ELETRONICO", pattern: /\bpregao\s+eletronico\b/i },
  { label: "PREGAO PRESENCIAL", pattern: /\bpregao\s+presencial\b/i },
  { label: "PREGAO", pattern: /\bpregao\b/i },
  { label: "CONCORRENCIA", pattern: /\bconcorrencia\b/i },
  { label: "DISPENSA", pattern: /\bdispensa\b/i },
  { label: "INEXIGIBILIDADE", pattern: /\binexigibilidade\b/i },
  { label: "TOMADA DE PRECOS", pattern: /\btomada de precos\b/i },
  { label: "CREDENCIAMENTO", pattern: /\bcredenciamento\b/i },
];

function cleanText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeForSearch(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°]/g, "o")
    .replace(/[ÂÃ]/g, "")
    .toLowerCase();
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeDate(value) {
  if (!value) return null;
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseBrazilianMoney(value) {
  if (!value) return null;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  if (!/\d/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function createLineEntries(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((original) => ({
      original,
      normalized: normalizeForSearch(original),
    }));
}

function findFirstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function findLineValue(entries, patterns) {
  for (const entry of entries) {
    for (const pattern of patterns) {
      const match = entry.normalized.match(pattern);
      if (!match) continue;
      const slice = entry.original.slice(match.index + match[0].length).trim();
      if (slice) return slice.replace(/^[:\-\s]+/, "").trim();
    }
  }
  return null;
}

function detectContractNumber(text) {
  return findFirstMatch(text, [/\b(?:contrato|ata)\b\s*(?:n[o0.]*)?\s*[:\-]?\s*([a-z0-9./-]{3,})/i]);
}

function detectLicitationNumber(text) {
  return findFirstMatch(text, [
    /\b(?:pregao(?:\s+eletronico|\s+presencial)?|concorrencia|dispensa|inexigibilidade|licitacao)\b\s*(?:n[o0.]*)?\s*[:\-]?\s*([a-z0-9./-]{3,})/i,
    /\bedital\b\s*(?:n[o0.]*)?\s*[:\-]?\s*([a-z0-9./-]{3,})/i,
  ]);
}

function detectProcessNumber(text) {
  return findFirstMatch(text, [/\b(?:processo(?: administrativo)?)\b\s*(?:n[o0.]*)?\s*[:\-]?\s*([a-z0-9./-]{3,})/i]);
}

function detectDate(entries, labelPatterns) {
  const lineValue = findLineValue(entries, labelPatterns);
  if (lineValue) {
    const date = normalizeDate(lineValue);
    if (date) return date;
  }

  for (const entry of entries) {
    if (!labelPatterns.some((pattern) => pattern.test(entry.normalized))) continue;
    const fallback = normalizeDate(entry.original);
    if (fallback) return fallback;
  }

  return null;
}

function detectCnpj(text) {
  return findFirstMatch(text, [/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/]);
}

function cleanupCapturedValue(value) {
  return value ? value.replace(/^[:\-\s]+/, "").trim() : null;
}

function detectObject(entries) {
  const labeled = findLineValue(entries, [
    /(?:^|\b)objeto do contrato\b/,
    /(?:^|\b)descricao do objeto\b/,
    /(?:^|\b)objeto\b/,
    /constitui objeto/,
  ]);
  if (labeled) return cleanupCapturedValue(labeled);

  const candidates = entries
    .filter((entry) => OBJECT_KEYWORDS.test(entry.normalized))
    .sort((a, b) => b.original.length - a.original.length);

  return candidates[0]?.original || null;
}

function scoreSupplierCandidate(original, normalized) {
  let score = 0;
  if (/^(fornecedor|contratada|empresa|razao social)\b/i.test(normalized)) score += 6;
  if (/\bvencedor\b/i.test(normalized)) score += 4;
  if (/\b(ltda|eireli|me|epp|sa|s\/a|servicos)\b/i.test(normalized)) score += 3;
  if (/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/.test(original)) score += 2;
  return score;
}

function stripSupplierNoise(value) {
  return value
    .replace(/\b(cnpj|cpf)\b.*$/i, "")
    .replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, "")
    .replace(/^(?:fornecedor|contratada|razao social|vencedor)\b[:\-\s]*/i, "")
    .replace(/\s+-\s*$/, "")
    .trim();
}

function detectSupplierName(entries, cnpj) {
  const labeled = findLineValue(entries, [/^(?:fornecedor|contratada|empresa|razao social)\b\s*[:\-]/]);
  const cleanedLabeled = stripSupplierNoise(labeled || "");
  if (cleanedLabeled && !/^(?:fornecedor|vencedor)$/i.test(cleanedLabeled)) return cleanedLabeled;

  const compactCnpj = cnpj ? cnpj.replace(/[^\d]/g, "") : null;
  const candidates = [];

  for (const entry of entries) {
    const hasCompanyShape = /\b(ltda|eireli|me|epp|sa|s\/a)\b/i.test(entry.original);
    const hasWinningHint = /\b(fornecedor|vencedor)\b/i.test(entry.normalized);
    const hasCnpj = compactCnpj && entry.original.replace(/[^\d]/g, "").includes(compactCnpj);

    if (!hasCompanyShape && !hasWinningHint && !hasCnpj) continue;

    const cleaned = stripSupplierNoise(entry.original);
    if (!cleaned || /^(?:fornecedor|vencedor)$/i.test(cleaned)) continue;

    candidates.push({
      value: cleaned,
      score: scoreSupplierCandidate(entry.original, entry.normalized),
    });
  }

  candidates.sort((a, b) => b.score - a.score || b.value.length - a.value.length);
  return candidates[0]?.value || null;
}

function detectModality(text) {
  for (const item of MODALITY_PATTERNS) {
    if (item.pattern.test(text)) return item.label;
  }
  return null;
}

function detectUnits(entries) {
  const units = unique(entries.filter((entry) => UNIT_KEYWORDS.test(entry.normalized)).map((entry) => entry.original));
  return {
    primary: units[0] || null,
    participants: units,
  };
}

function scoreMoneyCandidate(entry) {
  let score = 0;
  if (/\b(valor global|valor total|valor do contrato|preco global|preco total)\b/i.test(entry.normalized)) score += 8;
  if (/\b(valor estimado da contratacao|valor estimado)\b/i.test(entry.normalized)) score += 6;
  if (/\b(valor)\b/i.test(entry.normalized)) score += 3;
  if (/\b(multa|garantia|penalidade|juros|correcao)\b/i.test(entry.normalized)) score -= 8;
  return score;
}

function detectHighestMoney(entries) {
  const candidates = [];

  for (const entry of entries) {
    const moneyMatches = [...entry.original.matchAll(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/gi)];
    for (const match of moneyMatches) {
      const value = parseBrazilianMoney(match[1]);
      if (!Number.isFinite(value)) continue;
      candidates.push({
        value,
        score: scoreMoneyCandidate(entry),
      });
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score || b.value - a.value);
  return candidates[0].value;
}

function buildSingleLot(objectText, totalValue) {
  if (!objectText || !Number.isFinite(totalValue)) return [];
  return [
    {
      numero: "1",
      titulo: "Lote unico",
      itens: [
        {
          numero: "1",
          descricao: objectText,
          quantidade: 1,
          unidade_medida: "UN",
          valor_unitario: totalValue,
        },
      ],
    },
  ];
}

function buildUnresolved(fields) {
  const unresolved = [];
  for (const field of fields) {
    if (!field.ok) unresolved.push(field.path);
  }
  unresolved.push("tenant_id");
  unresolved.push("contrato_ata.objeto_resumido_id");
  unresolved.push("contrato_ata.unidade_gerenciadora_id");
  unresolved.push("contrato_ata.unidades_participantes");
  unresolved.push("licitacao.modalidade_id");
  return unresolved;
}

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

  const hints = {
    objeto_resumido_busca: objectText ? objectText.split(/[;,.-]/)[0].trim().toLowerCase() : null,
    modalidade_nome: modality,
    unidade_gerenciadora_nome: units.primary,
    unidades_participantes_nomes: units.participants.length ? units.participants : units.primary ? [units.primary] : [],
  };

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
