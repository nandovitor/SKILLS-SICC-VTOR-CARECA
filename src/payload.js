const { z } = require("zod");

const finalSchema = z.object({
  tenant_id: z.string().min(1),
  contrato_ata: z.object({
    data: z.string().min(1),
    data_validade: z.string().min(1),
    numero: z.string().min(1),
    objeto: z.string().min(1),
    objeto_resumido_id: z.number().int(),
    tipo: z.string().min(1),
    unidade_gerenciadora_id: z.number().int(),
    unidades_participantes: z.array(z.number().int()).min(1),
    valor: z.number(),
  }),
  fornecedor: z.object({
    cnpj_cpf: z.string().min(11),
    razao_social: z.string().min(1),
  }).passthrough(),
  licitacao: z.object({
    modalidade_id: z.number().int(),
    numero: z.string().min(1),
    numero_processo_adm: z.string().min(1),
    objeto: z.string().min(1),
  }),
  lotes: z.array(z.any()).optional(),
});

function buildDraftPayload(data) {
  const normalized = data.normalized || data;
  const contract = normalized.contrato_ata || {};
  const supplier = normalized.fornecedor || {};
  const licitation = normalized.licitacao || {};
  const hints = normalized.hints || {};

  return {
    sourceFile: data.sourceFile || null,
    unresolved: normalized.unresolved || [],
    hints,
    payloadDraft: {
      tenant_id: null,
      documentos: [
        {
          contrato_ata: {
            data: contract.data || null,
            data_validade: contract.data_validade || null,
            numero: contract.numero || null,
            objeto: contract.objeto || null,
            objeto_resumido_id: null,
            tipo: contract.tipo || "CONTRATO",
            unidade_gerenciadora_id: null,
            unidades_participantes: [],
            valor: Number.isFinite(contract.valor) ? contract.valor : null,
          },
          fornecedor: {
            cnpj_cpf: supplier.cnpj_cpf || null,
            razao_social: supplier.razao_social || null,
          },
          licitacao: {
            modalidade_id: null,
            numero: licitation.numero || null,
            numero_processo_adm: licitation.numero_processo_adm || null,
            objeto: licitation.objeto || contract.objeto || null,
          },
          lotes: normalized.lotes || [],
        },
      ],
    },
  };
}

function buildFinalPayload(input) {
  const parsed = finalSchema.parse(input);
  return {
    tenant_id: parsed.tenant_id,
    documentos: [
      {
        contrato_ata: {
          ...parsed.contrato_ata,
          unidades_participantes: parsed.contrato_ata.unidades_participantes.length
            ? parsed.contrato_ata.unidades_participantes
            : [parsed.contrato_ata.unidade_gerenciadora_id],
        },
        fornecedor: {
          ...parsed.fornecedor,
          cnpj_cpf: parsed.fornecedor.cnpj_cpf.replace(/[^\d]/g, ""),
        },
        licitacao: parsed.licitacao,
        ...(parsed.lotes ? { lotes: parsed.lotes } : {}),
      },
    ],
  };
}

module.exports = {
  buildDraftPayload,
  buildFinalPayload,
};
