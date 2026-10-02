import { createFileRoute } from "@tanstack/react-router";

import { defineHandler, json, noContent, readJson } from "@/server/http";
import { deletePackage, updatePackage } from "@/server/repositories/packages";
import { requireUser } from "@/server/session";
import { packageUpdateSchema } from "@/server/validation";

export const Route = createFileRoute("/api/packages/$id")({
  server: {
    handlers: {
      PATCH: defineHandler(async ({ session, params, request }) => {
        const patch = packageUpdateSchema.parse(await readJson(request));
        return json(await updatePackage(requireUser(session).id, params["id"] ?? "", patch));
      }),

      DELETE: defineHandler(async ({ session, params }) => {
        await deletePackage(requireUser(session).id, params["id"] ?? "");
        return noContent();
      }),
    },
  },
});
