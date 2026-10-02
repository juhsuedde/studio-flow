import { ApiError } from "../errors";
import { getDb } from "../db";
import type { Patch } from "../db/adapter";
import type { Invoice } from "@/lib/data/types";

/**
 * Acesso a `invoices` (1 linha por ensaio), sempre filtrado por `ownerId`.
 *
 * TODO(supabase): cada função vira uma chamada `supabase.from("invoices")`
 * com `.eq("owner_id", ownerId)` — o RLS de `schema.sql` garante o mesmo filtro.
 */

/** Mapa booking_id → nota fiscal para resolver as relações da listagem de ensaios. */
export async function invoicesByBookings(ownerId: string): Promise<Map<string, Invoice>> {
  const rows = await getDb().invoices.list(ownerId);
  return new Map(rows.map((row) => [row.booking_id, row]));
}

export async function getInvoice(ownerId: string, bookingId: string): Promise<Invoice | null> {
  return (await invoicesByBookings(ownerId)).get(bookingId) ?? null;
}

export type InvoicePatch = Partial<Pick<Invoice, "status" | "numero" | "issued_on">>;

/** Atualiza os campos; cria a linha se ainda não existir (upsert, ex.: booking antigo). */
export async function upsertInvoice(
  ownerId: string,
  bookingId: string,
  patch: InvoicePatch,
): Promise<Invoice> {
  const existing = await getInvoice(ownerId, bookingId);
  const timestamp = new Date().toISOString();
  if (existing) {
    const updated = await getDb().invoices.update(ownerId, existing.id, {
      ...patch,
      updated_at: timestamp,
    } satisfies Patch<Invoice>);
    if (!updated) throw ApiError.internal();
    return updated;
  }
  const row: Invoice = {
    id: crypto.randomUUID(),
    owner_id: ownerId,
    booking_id: bookingId,
    status: "pendente",
    numero: null,
    issued_on: null,
    created_at: timestamp,
    updated_at: timestamp,
    ...patch,
  };
  return getDb().invoices.insert(row);
}

/** Total de notas do dono — base do número sequencial mock de `emitInvoice`. */
export async function countInvoices(ownerId: string): Promise<number> {
  return (await getDb().invoices.list(ownerId)).length;
}
