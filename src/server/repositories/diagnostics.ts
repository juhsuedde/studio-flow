import { ApiError } from "../errors";
import { getDb } from "../db";
import type { Patch } from "../db/adapter";
import type { Diagnostic, DiagnosticContent } from "@/lib/data/types";

/**
 * Acesso a `diagnostics` (1 linha por ensaio), sempre filtrado por `ownerId`.
 *
 * TODO(supabase): cada função vira uma chamada `supabase.from("diagnostics")`
 * com `.eq("owner_id", ownerId)` — o RLS de `schema.sql` garante o mesmo filtro.
 */

/** Mapa booking_id → diagnostic para resolver as relações da listagem de ensaios. */
export async function diagnosticsByBookings(ownerId: string): Promise<Map<string, Diagnostic>> {
  const rows = await getDb().diagnostics.list(ownerId);
  return new Map(rows.map((row) => [row.booking_id, row]));
}

export async function getDiagnostic(
  ownerId: string,
  bookingId: string,
): Promise<Diagnostic | null> {
  return (await diagnosticsByBookings(ownerId)).get(bookingId) ?? null;
}

/** Grava o `conteudo` das seções; cria a linha se ainda não existir (upsert). */
export async function upsertDiagnostic(
  ownerId: string,
  bookingId: string,
  conteudo: DiagnosticContent,
): Promise<Diagnostic> {
  const existing = await getDiagnostic(ownerId, bookingId);
  const timestamp = new Date().toISOString();
  if (existing) {
    const updated = await getDb().diagnostics.update(ownerId, existing.id, {
      conteudo,
      updated_at: timestamp,
    } satisfies Patch<Diagnostic>);
    if (!updated) throw ApiError.internal();
    return updated;
  }
  const row: Diagnostic = {
    id: crypto.randomUUID(),
    owner_id: ownerId,
    booking_id: bookingId,
    conteudo,
    created_at: timestamp,
    updated_at: timestamp,
  };
  return getDb().diagnostics.insert(row);
}
