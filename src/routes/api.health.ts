import { createFileRoute } from "@tanstack/react-router";

import { getDb } from "@/server/db";
import { defineHandler, json } from "@/server/http";
import { getSession } from "@/server/session";

/**
 * Estado do backend. Útil para confirmar qual adapter está ativo e, mais tarde,
 * quais integrações existem.
 * TODO(integrations): reportar `auth`/`ai` reais aqui conforme forem plugados.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: defineHandler(({ request }) => {
        const session = getSession(request);
        return json({
          status: "ok",
          database: {
            driver: getDb().persistent ? "file" : "memory",
            persistent: getDb().persistent,
          },
          auth: { provider: session.provider, isGuest: session.isGuest },
          ai: { extraction: "heuristic" },
        });
      }),
    },
  },
});
