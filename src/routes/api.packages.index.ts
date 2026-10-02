import { createFileRoute } from "@tanstack/react-router";

import { defineHandler, json, readJson } from "@/server/http";
import { createPackage, listPackages } from "@/server/repositories/packages";
import { requireUser } from "@/server/session";
import { packageCreateSchema } from "@/server/validation";

export const Route = createFileRoute("/api/packages/")({
  server: {
    handlers: {
      GET: defineHandler(async ({ session }) => json(await listPackages(requireUser(session).id))),

      POST: defineHandler(async ({ session, request }) => {
        const input = packageCreateSchema.parse(await readJson(request));
        return json(await createPackage(requireUser(session).id, input), { status: 201 });
      }),
    },
  },
});
