import { ApiError } from "../errors";
import { getDb } from "../db";
import type { Patch } from "../db/adapter";
import type { Contract, ContractStatus } from "@/lib/data/types";

/**
 * Acesso a `contracts` (1 linha por ensaio), sempre filtrado por `ownerId`.
 *
 * TODO(supabase): cada função vira uma chamada `supabase.from("contracts")`
 * com `.eq("owner_id", ownerId)` — o RLS de `schema.sql` garante o mesmo filtro.
 */

/** Mapa booking_id → contrato para resolver as relações da listagem de ensaios. */
export async function contractsByBookings(ownerId: string): Promise<Map<string, Contract>> {
  const rows = await getDb().contracts.list(ownerId);
  return new Map(rows.map((row) => [row.booking_id, row]));
}

export async function getContract(ownerId: string, bookingId: string): Promise<Contract | null> {
  return (await contractsByBookings(ownerId)).get(bookingId) ?? null;
}

/** Atualiza o status; cria a linha se ainda não existir (upsert, ex.: booking antigo). */
export async function upsertContract(
  ownerId: string,
  bookingId: string,
  status: ContractStatus,
): Promise<Contract> {
  const existing = await getContract(ownerId, bookingId);
  const timestamp = new Date().toISOString();
  if (existing) {
    const updated = await getDb().contracts.update(ownerId, existing.id, {
      status,
      updated_at: timestamp,
    } satisfies Patch<Contract>);
    if (!updated) throw ApiError.internal();
    return updated;
  }
  const row: Contract = {
    id: crypto.randomUUID(),
    owner_id: ownerId,
    booking_id: bookingId,
    status,
    created_at: timestamp,
    updated_at: timestamp,
  };
  return getDb().contracts.insert(row);
}
