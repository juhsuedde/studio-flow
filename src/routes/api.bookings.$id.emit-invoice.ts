import { createFileRoute } from "@tanstack/react-router";

import { defineHandler, json } from "@/server/http";
import { emitInvoice } from "@/server/services/invoices";
import { requireUser } from "@/server/session";

/**
 * Emite a nota fiscal do ensaio. Sem body: a ação é "emitir deste ensaio".
 *
 * TODO(edge-function): quando o provedor de NFe real entrar, o handler continua
 * o mesmo — a mudança fica dentro de `emitInvoice`.
 */
export const Route = createFileRoute("/api/bookings/$id/emit-invoice")({
  server: {
    handlers: {
      POST: defineHandler(async ({ session, params }) => {
        return json(await emitInvoice(requireUser(session).id, params["id"] ?? ""));
      }),
    },
  },
});
