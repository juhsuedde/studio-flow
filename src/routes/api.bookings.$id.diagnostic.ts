import { createFileRoute } from "@tanstack/react-router";

import { defineHandler, json, readJson } from "@/server/http";
import { saveDiagnostic } from "@/server/services/diagnostics";
import { requireUser } from "@/server/session";
import { diagnosticSaveSchema } from "@/server/validation";

/**
 * Persiste o `conteudo` (jsonb) do diagnóstico do ensaio.
 *
 * TODO(edge-function): quando o export para o Notion existir, ele usa a mesma
 * origem de dados — este endpoint continua sendo o dono do conteúdo.
 */
export const Route = createFileRoute("/api/bookings/$id/diagnostic")({
  server: {
    handlers: {
      PUT: defineHandler(async ({ session, params, request }) => {
        const body = diagnosticSaveSchema.parse(await readJson(request));
        return json(
          await saveDiagnostic(requireUser(session).id, params["id"] ?? "", body.conteudo),
        );
      }),
    },
  },
});
