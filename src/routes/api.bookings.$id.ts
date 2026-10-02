import { createFileRoute } from "@tanstack/react-router";

import { ApiError } from "@/server/errors";
import { defineHandler, json, noContent, readJson } from "@/server/http";
import { deleteBooking, getBooking, updateBooking } from "@/server/repositories/bookings";
import { requireUser } from "@/server/session";
import { bookingUpdateSchema } from "@/server/validation";

export const Route = createFileRoute("/api/bookings/$id")({
  server: {
    handlers: {
      GET: defineHandler(async ({ session, params }) => {
        const booking = await getBooking(requireUser(session).id, params["id"] ?? "");
        if (!booking) throw ApiError.notFound("Ensaio não encontrado");
        return json(booking);
      }),

      PATCH: defineHandler(async ({ session, params, request }) => {
        const patch = bookingUpdateSchema.parse(await readJson(request));
        return json(await updateBooking(requireUser(session).id, params["id"] ?? "", patch));
      }),

      DELETE: defineHandler(async ({ session, params }) => {
        await deleteBooking(requireUser(session).id, params["id"] ?? "");
        return noContent();
      }),
    },
  },
});
