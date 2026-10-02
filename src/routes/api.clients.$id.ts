import { createFileRoute } from "@tanstack/react-router";

import { ApiError } from "@/server/errors";
import { defineHandler, json, noContent, readJson } from "@/server/http";
import { deleteClient, getClient, updateClient } from "@/server/repositories/clients";
import { requireUser } from "@/server/session";
import { clientUpdateSchema } from "@/server/validation";

export const Route = createFileRoute("/api/clients/$id")({
  server: {
    handlers: {
      GET: defineHandler(async ({ session, params }) => {
        const client = await getClient(requireUser(session).id, params["id"] ?? "");
        if (!client) throw ApiError.notFound("Cliente não encontrada");
        return json(client);
      }),

      PATCH: defineHandler(async ({ session, params, request }) => {
        const patch = clientUpdateSchema.parse(await readJson(request));
        return json(await updateClient(requireUser(session).id, params["id"] ?? "", patch));
      }),

      DELETE: defineHandler(async ({ session, params }) => {
        await deleteClient(requireUser(session).id, params["id"] ?? "");
        return noContent();
      }),
    },
  },
});
