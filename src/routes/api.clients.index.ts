import { createFileRoute } from "@tanstack/react-router";

import { defineHandler, json, readJson } from "@/server/http";
import { createClient, listClients } from "@/server/repositories/clients";
import { requireUser } from "@/server/session";
import { clientCreateSchema } from "@/server/validation";

// TODO(supabase): GET vira `supabase.from("clients").select("*").order("name")`;
// POST vira `.insert(...).select().single()` com `owner_id` vindo do JWT.
export const Route = createFileRoute("/api/clients/")({
  server: {
    handlers: {
      GET: defineHandler(async ({ session }) => json(await listClients(requireUser(session).id))),

      POST: defineHandler(async ({ session, request }) => {
        const input = clientCreateSchema.parse(await readJson(request));
        const client = await createClient(requireUser(session).id, input);
        return json(client, { status: 201 });
      }),
    },
  },
});
