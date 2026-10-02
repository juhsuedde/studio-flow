import { apiRequest } from "@/lib/api/client";
import type { BookingDraft } from "./types";

/**
 * Texto livre → campos do formulário.
 *
 * A heurística mora no servidor (`src/server/services/extraction.ts`), não aqui:
 * quando a Edge Function com IA entrar, só a implementação do servidor muda e
 * esta função continua igual.
 *
 * TODO(edge-function): o campo `engine` passa a valer "ai" quando a Edge
 * Function `extract-booking` estiver no ar; a UI já mostra `notice`.
 */

export interface ExtractResponse {
  draft: BookingDraft;
  engine: "heuristic" | "ai";
  notice: string;
}

export async function extractBookingFromText(
  text: string,
  draft: BookingDraft,
): Promise<ExtractResponse> {
  return apiRequest<ExtractResponse>("/api/extract", { method: "POST", body: { text, draft } });
}
