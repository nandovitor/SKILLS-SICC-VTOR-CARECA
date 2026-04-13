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

function buildHints(objectText, modality, units) {
  return {
    objeto_resumido_busca: objectText ? objectText.split(/[;,.-]/)[0].trim().toLowerCase() : null,
    modalidade_nome: modality,
    unidade_gerenciadora_nome: units.primary,
    unidades_participantes_nomes: units.participants.length ? units.participants : units.primary ? [units.primary] : [],
  };
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

module.exports = {
  buildSingleLot,
  buildHints,
  buildUnresolved,
};
