import { delay, now, readTable, uid, writeTable } from "./store";
import type { Package, PackageInput } from "./types";

// TODO(supabase): supabase.from("packages").select("*").order("price_cents")
export async function listPackages(): Promise<Package[]> {
  await delay();
  return readTable<Package>("packages").sort((a, b) => a.price_cents - b.price_cents);
}

// TODO(supabase): supabase.from("packages").insert(input).select().single()
export async function createPackage(input: PackageInput): Promise<Package> {
  await delay();
  const row: Package = { ...input, id: uid(), created_at: now(), updated_at: now() };
  writeTable("packages", [...readTable<Package>("packages"), row]);
  return row;
}

// TODO(supabase): supabase.from("packages").update(input).eq("id", id).select().single()
export async function updatePackage(id: string, input: Partial<PackageInput>): Promise<Package> {
  await delay();
  const rows = readTable<Package>("packages");
  const i = rows.findIndex((p) => p.id === id);
  if (i < 0) throw new Error("Pacote não encontrado");
  rows[i] = { ...rows[i], ...input, updated_at: now() };
  writeTable("packages", rows);
  return rows[i];
}

// TODO(supabase): supabase.from("packages").delete().eq("id", id)
export async function deletePackage(id: string): Promise<void> {
  await delay();
  const inUse = readTable<{ package_id: string }>("bookings").some((b) => b.package_id === id);
  if (inUse) throw new Error("Pacote em uso por ensaios. Desative-o em vez de excluir.");
  writeTable("packages", readTable<Package>("packages").filter((p) => p.id !== id));
}
