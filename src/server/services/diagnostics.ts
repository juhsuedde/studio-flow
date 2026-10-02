import { ApiError } from "../errors";
import { getBooking } from "../repositories/bookings";
import { upsertDiagnostic } from "../repositories/diagnostics";
import type { Diagnostic, DiagnosticContent } from "@/lib/data/types";

/**
 * Regras de negócio do diagnóstico do ensaio.
 *
 * TODO(edge-function): a integração com o Notion vira uma Edge Function — a
 * UI só desabilita o botão hoje. Quando implementar, `exportDiagnosticToNotion`
 * é quem faz a chamada real, e a tela continua a mesma.
 */

/** Persiste o `conteudo` (jsonb) das seções do diagnóstico. */
export async function saveDiagnostic(
  ownerId: string,
  bookingId: string,
  conteudo: DiagnosticContent,
): Promise<Diagnostic> {
  const booking = await getBooking(ownerId, bookingId);
  if (!booking) throw ApiError.notFound("Ensaio não encontrado");
  return upsertDiagnostic(ownerId, bookingId, conteudo);
}

/**
 * TODO(notion): exportar o diagnóstico para o Notion.
 *   1. montar uma página com as seções de `conteudo`;
 *   2. POST no workspace via OAuth;
 *   3. persistir a URL da página (campo futuro em `diagnostics`).
 */
export async function exportDiagnosticToNotion(
  _ownerId: string,
  _bookingId: string,
): Promise<never> {
  throw ApiError.notImplemented("Exportar para o Notion estará disponível em breve.");
}
