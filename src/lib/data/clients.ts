import { delay, now, readTable, uid, writeTable } from "./store";
import type { Client, ClientInput } from "./types";

// TODO(supabase): supabase.from("clients").select("*").order("name")
export async function listClients(): Promise<Client[]> {
  await delay();
  return readTable<Client>("clients").sort((a, b) => a.name.localeCompare(b.name));
}

// TODO(supabase): supabase.from("clients").select("*").eq("id", id).single()
export async function getClient(id: string): Promise<Client | null> {
  await delay(100);
  return readTable<Client>("clients").find((c) => c.id === id) ?? null;
}

// TODO(supabase): supabase.from("clients").insert(input).select().single()
// (owner_id é preenchido pelo default auth.uid() no banco)
export async function createClient(input: ClientInput): Promise<Client> {
  await delay();
  const row: Client = { ...input, id: uid(), owner_id: "mock-owner", created_at: now(), updated_at: now() };
  writeTable("clients", [...readTable<Client>("clients"), row]);
  return row;
}

// TODO(supabase): supabase.from("clients").update(input).eq("id", id).select().single()
export async function updateClient(id: string, input: Partial<ClientInput>): Promise<Client> {
  await delay();
  const rows = readTable<Client>("clients");
  const i = rows.findIndex((c) => c.id === id);
  if (i < 0) throw new Error("Cliente não encontrada");
  const current = rows[i];
  if (!current) throw new Error("Cliente não encontrada");
  const updated: Client = { ...current, ...input, updated_at: now() };
  rows[i] = updated;
  writeTable("clients", rows);
  return updated;
}

// TODO(supabase): supabase.from("clients").delete().eq("id", id)
// (FK bookings.client_id é ON DELETE RESTRICT no banco)
export async function deleteClient(id: string): Promise<void> {
  await delay();
  const hasBookings = readTable<{ client_id: string }>("bookings").some((b) => b.client_id === id);
  if (hasBookings) throw new Error("Esta cliente possui ensaios. Remova-os antes de excluir.");
  writeTable("clients", readTable<Client>("clients").filter((c) => c.id !== id));
}
