import { createFileRoute } from "@tanstack/react-router";

import { getDb } from "@/server/db";
import { ApiError } from "@/server/errors";
import { defineHandler, json } from "@/server/http";

/**
 * Recarrega o seed. Substitui o `resetAll()` que existia no mock de localStorage.
 *
 * Restrito a desenvolvimento porque descarta dados sem confirmação.
 * TODO(supabase): some junto com o mock — em produção não há seed para recarregar.
 */
export const Route = createFileRoute("/api/dev/reset")({
  server: {
    handlers: {
      POST: defineHandler(async () => {
        if (process.env["NODE_ENV"] === "production") {
          throw new ApiError(403, "forbidden", "Reset disponível apenas em desenvolvimento");
        }
        await getDb().reset();
        return json({ status: "reset" });
      }),
    },
  },
});
