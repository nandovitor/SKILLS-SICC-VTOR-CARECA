# Payloads

## Draft

O comando `sicc-codex draft-payload contrato.pdf` gera um JSON com:

- `payloadDraft`
- `hints`
- `unresolved`

## Final

O formato final enviado ao MCP deve seguir:

```json
{
  "tenant_id": "seu-tenant-id",
  "documentos": [
    {
      "contrato_ata": {},
      "fornecedor": {},
      "licitacao": {},
      "lotes": []
    }
  ]
}
```
