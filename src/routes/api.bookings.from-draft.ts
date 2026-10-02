import { createFileRoute } from "@tanstack/react-router";

import { defineHandler, json, readJson } from "@/server/http";
import { saveBookingDraft } from "@/server/services/booking-draft";
import { requireUser } from "@/server/session";
import { bookingDraftSchema } from "@/server/validation";

/**
 * Gravação do ensaio a partir do `BookingDraft`.
 *
 * Ponto único de entrada dos DOIS modos de cadastro: com `bookingId` atualiza,
 * sem ele cria. `PUT` é usado em vez de `POST` porque a operação é um "upsert"
 * do rascunho completo — e porque centralizar aqui é o que impede os modos de
 * divergirem entre si.
 *
 * TODO(supabase): vira a RPC `save_booking_from_draft`.
 */
export const Route = createFileRoute("/api/bookings/from-draft")({
  server: {
    handlers: {
      PUT: defineHandler(async ({ session, request }) => {
        const body = (await readJson(request)) as { draft?: unknown; bookingId?: unknown };
        const draft = bookingDraftSchema.parse(body.draft);
        const bookingId =
          typeof body.bookingId === "string" && body.bookingId ? body.bookingId : undefined;
        return json(await saveBookingDraft(requireUser(session).id, draft, bookingId), {
          status: bookingId ? 200 : 201,
        });
      }),
    },
  },
});
