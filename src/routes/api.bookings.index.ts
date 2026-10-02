import { createFileRoute } from "@tanstack/react-router";

import { defineHandler, json, readJson } from "@/server/http";
import { createBooking, listBookings } from "@/server/repositories/bookings";
import { requireUser } from "@/server/session";
import { bookingCreateSchema } from "@/server/validation";

// TODO(edge-function): depois de criar, disparar "sync-google-calendar", que
// atualiza calendar_sync_status — o hook já existe no serviço de integrações.
export const Route = createFileRoute("/api/bookings/")({
  server: {
    handlers: {
      GET: defineHandler(async ({ session }) => json(await listBookings(requireUser(session).id))),

      POST: defineHandler(async ({ session, request }) => {
        const input = bookingCreateSchema.parse(await readJson(request));
        return json(await createBooking(requireUser(session).id, input), { status: 201 });
      }),
    },
  },
});
