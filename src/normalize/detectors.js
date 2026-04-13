const {
  unique,
  normalizeDate,
  parseBrazilianMoney,
  findFirstMatch,
  findLineValue,
  cleanupCapturedValue,
} = require("./utils");

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

module.exports = {
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
};
