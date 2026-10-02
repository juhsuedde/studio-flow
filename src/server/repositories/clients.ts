import { ApiError } from "../errors";
import { getDb } from "../db";
import type { Client, ClientInput } from "@/lib/data/types";
import type { Patch } from "../db/adapter";
import type { ClientUpdateInput } from "../validation";

/**
 * Acesso a `clients`, sempre filtrado por `ownerId`.
 *
 * TODO(supabase): cada função vira uma chamada `supabase.from("clients")` com
 * `.eq("owner_id", ownerId)` — o RLS de `schema.sql` garante o mesmo filtro.
 */

const byName = (a: Client, b: Client) => a.name.localeCompare(b.name, "pt-BR");

export async function listClients(ownerId: string): Promise<Client[]> {
  const rows = await getDb().clients.list(ownerId);
  return rows.sort(byName);
}

export async function getClient(ownerId: string, id: string): Promise<Client | null> {
  return getDb().clients.get(ownerId, id);
}

export async function createClient(ownerId: string, input: ClientInput): Promise<Client> {
  const timestamp = new Date().toISOString();
  const row: Client = {
    // `owner_id` vem da sessão, nunca do body — o default auth.uid() do banco
    // deixa de ser necessário porque o adapter já grava o valor resolvido.
    owner_id: ownerId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    cpf: input.cpf,
    notes: input.notes,
    id: crypto.randomUUID(),
    created_at: timestamp,
    updated_at: timestamp,
  };
  return getDb().clients.insert(row);
}

export async function updateClient(
  ownerId: string,
  id: string,
  patch: ClientUpdateInput,
): Promise<Client> {
  const updated = await getDb().clients.update(ownerId, id, {
    ...patch,
    updated_at: new Date().toISOString(),
  } satisfies Patch<Client>);
  if (!updated) throw ApiError.notFound("Cliente não encontrada");
  return updated;
}

/** Equivale ao `ON DELETE RESTRICT` de `bookings.client_id` no schema.sql. */
export async function deleteClient(ownerId: string, id: string): Promise<void> {
  const bookings = await getDb().bookings.list(ownerId);
  if (bookings.some((booking) => booking.client_id === id)) {
    throw ApiError.conflict("Esta cliente possui ensaios. Remova-os antes de excluir.");
  }
  const removed = await getDb().clients.delete(ownerId, id);
  if (!removed) throw ApiError.notFound("Cliente não encontrada");
}
