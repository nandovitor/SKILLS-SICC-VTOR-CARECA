function cleanText(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function findFirst(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function findAll(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[1].trim());
}

function detectObject(lines, text) {
  const direct =
    findFirst(text, [
      /(?:objeto|objeto do contrato|descricao do objeto)\s*[:\-]\s*(.+)/i,
      /(?:constitui objeto.+?)\s*[:\-]\s*(.+)/i,
    ]) || null;

  if (direct) return direct;

  const candidates = lines
    .filter((line) => /servic|aquisic|contratac|locac|fornec|prestac/i.test(line))
    .sort((a, b) => b.length - a.length);

  return candidates[0] || null;
}

function detectSupplierName(lines, text, cnpj) {
  const direct =
    findFirst(text, [
      /(?:fornecedor|contratada|empresa|razao social)\s*[:\-]\s*(.+)/i,
      /(?:contratada:\s*)(.+)/i,
    ]) || null;

  if (direct) return direct;

  if (cnpj) {
    const compact = cnpj.replace(/[^\d]/g, "");
    for (const line of lines) {
      if (line.replace(/[^\d]/g, "").includes(compact)) {
        const withoutCnpj = line.replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/, "").trim();
        if (withoutCnpj) return withoutCnpj.replace(/^[\W_]+/, "");
      }
    }
  }

  return null;
}

function detectModality(text) {
  const modalities = [
    "pregao eletronico",
    "pregao presencial",
    "pregao",
    "concorrencia",
    "dispensa",
    "inexigibilidade",
    "tomada de precos",
    "credenciamento",
  ];

  const lower = text.toLowerCase();
  return modalities.find((item) => lower.includes(item)) || null;
}

function detectPrimaryUnit(lines) {
  return (
    lines.find((line) => /secretaria|fundo municipal|prefeitura|camara|gabinete|autarquia/i.test(line)) ||
    null
  );
}

function detectParticipants(lines) {
  return unique(lines.filter((line) => /secretaria|fundo municipal|prefeitura|camara|gabinete|autarquia/i.test(line)));
}

function detectHighestMoney(text) {
  const matches = [...text.matchAll(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/gi)];
  const values = matches
    .map((match) => parseBrazilianMoney(match[1]))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  return values.sort((a, b) => b - a)[0];
}

function normalizeContractText(rawText, metadata = {}) {
  const text = cleanText(rawText);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  const contractNumber = findFirst(text, [
    /(?:contrato|ata)\s*(?:n[ouº°.]*)?\s*[:\-]?\s*([A-Za-z0-9./-]{3,})/i,
  ]);
  const licitationNumber = findFirst(text, [
    /(?:pregao(?:\s+eletronico|\s+presencial)?|concorrencia|dispensa|inexigibilidade|licitacao)\s*(?:n[ouº°.]*)?\s*[:\-]?\s*([A-Za-z0-9./-]{3,})/i,
    /(?:edital)\s*(?:n[ouº°.]*)?\s*[:\-]?\s*([A-Za-z0-9./-]{3,})/i,
  ]);
  const processNumber = findFirst(text, [
    /(?:processo(?: administrativo)?)\s*(?:n[ouº°.]*)?\s*[:\-]?\s*([A-Za-z0-9./-]{3,})/i,
  ]);
  const signedDate = normalizeDate(findFirst(text, [/(?:data|assinatura)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i]));
  const validityDate = normalizeDate(findFirst(text, [/(?:vigencia|validade|termino)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i]));
  const cnpj = findFirst(text, [/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/]);
  const objectText = detectObject(lines, text);
  const supplierName = detectSupplierName(lines, text, cnpj);
  const modality = detectModality(text);
  const primaryUnit = detectPrimaryUnit(lines);
  const participants = detectParticipants(lines);
  const totalValue = detectHighestMoney(text);

  const hints = {
    objeto_resumido_busca: objectText ? objectText.split(/[;,.-]/)[0].trim().toLowerCase() : null,
    modalidade_nome: modality ? modality.toUpperCase() : null,
    unidade_gerenciadora_nome: primaryUnit,
    unidades_participantes_nomes: participants.length ? participants : primaryUnit ? [primaryUnit] : [],
  };

  const unresolved = [];
  if (!signedDate) unresolved.push("contrato_ata.data");
  if (!validityDate) unresolved.push("contrato_ata.data_validade");
  if (!contractNumber) unresolved.push("contrato_ata.numero");
  if (!objectText) unresolved.push("contrato_ata.objeto");
  if (!supplierName) unresolved.push("fornecedor.razao_social");
  if (!cnpj) unresolved.push("fornecedor.cnpj_cpf");
  if (!licitationNumber) unresolved.push("licitacao.numero");
  if (!processNumber) unresolved.push("licitacao.numero_processo_adm");
  if (!modality) unresolved.push("licitacao.modalidade_nome");
  unresolved.push("tenant_id");
  unresolved.push("contrato_ata.objeto_resumido_id");
  unresolved.push("contrato_ata.unidade_gerenciadora_id");
  unresolved.push("contrato_ata.unidades_participantes");
  unresolved.push("licitacao.modalidade_id");

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
      lotes: totalValue && objectText
        ? [
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
          ]
        : [],
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
