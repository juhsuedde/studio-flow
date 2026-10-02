import { createFileRoute } from "@tanstack/react-router";

import { defineHandler, json } from "@/server/http";
import { generateContract } from "@/server/services/contracts";
import { requireUser } from "@/server/session";

/**
 * Gera o contrato do ensaio. Sem body: a ação é "gerar o contrato deste ensaio".
 *
 * TODO(edge-function): quando a geração real (ClickSign/Docuseal) entrar, o
 * handler continua o mesmo — a mudança fica dentro de `generateContract`.
 */
export const Route = createFileRoute("/api/bookings/$id/generate-contract")({
  server: {
    handlers: {
      POST: defineHandler(async ({ session, params }) => {
        return json(await generateContract(requireUser(session).id, params["id"] ?? ""));
      }),
    },
  },
});
