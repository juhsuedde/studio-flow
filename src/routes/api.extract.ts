import { createFileRoute } from "@tanstack/react-router";

import { emptyDraft, type BookingDraft } from "@/lib/data/types";
import { defineHandler, json, readJson } from "@/server/http";
import { listPackages } from "@/server/repositories/packages";
import { extractBookingFromText } from "@/server/services/extraction";
import { requireUser } from "@/server/session";
import { extractRequestSchema } from "@/server/validation";
import { stripUndefined } from "@/server/util";

/**
 * Texto livre → campos preenchidos.
 *
 * A resposta já carrega `notice` e `engine` para que a UI exiba o aviso de que
 * a extração é heurística — quando a Edge Function entrar, a UI não muda.
 *
 * TODO(edge-function): `extractBookingFromText` passa a chamar a IA.
 */
export const Route = createFileRoute("/api/extract")({
  server: {
    handlers: {
      POST: defineHandler(async ({ session, request }) => {
        const body = extractRequestSchema.parse(await readJson(request));
        const packages = await listPackages(requireUser(session).id);
        // O rascunho atual é só a base: campos que a heurística não souber ler
        // mantêm o que a usuária já preencheu à mão.
        const base: BookingDraft = { ...emptyDraft(), ...stripUndefined(body.draft) };
        return json(extractBookingFromText(body.text, packages, base));
      }),
    },
  },
});
