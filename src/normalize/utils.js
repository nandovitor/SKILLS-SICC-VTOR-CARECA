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

function cleanupCapturedValue(value) {
  return value ? value.replace(/^[:\-\s]+/, "").trim() : null;
}

module.exports = {
  cleanText,
  normalizeForSearch,
  unique,
  normalizeDate,
  parseBrazilianMoney,
  createLineEntries,
  findFirstMatch,
  findLineValue,
  cleanupCapturedValue,
};
