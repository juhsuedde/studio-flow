import { ApiError } from "../errors";
import { getDb } from "../db";
import type { Package, PackageInput } from "@/lib/data/types";
import type { Patch } from "../db/adapter";
import type { PackageUpdateInput } from "../validation";

/**
 * Acesso a `packages`, sempre filtrado por `ownerId`.
 *
 * TODO(supabase): cada função vira `supabase.from("packages")` com
 * `.eq("owner_id", ownerId)`.
 */

const byPrice = (a: Package, b: Package) => a.price_cents - b.price_cents;

export async function listPackages(ownerId: string): Promise<Package[]> {
  const rows = await getDb().packages.list(ownerId);
  return rows.sort(byPrice);
}

export async function createPackage(ownerId: string, input: PackageInput): Promise<Package> {
  const timestamp = new Date().toISOString();
  const row: Package = {
    owner_id: ownerId,
    name: input.name,
    description: input.description,
    price_cents: input.price_cents,
    duration_minutes: input.duration_minutes,
    active: input.active,
    id: crypto.randomUUID(),
    created_at: timestamp,
    updated_at: timestamp,
  };
  return getDb().packages.insert(row);
}

export async function updatePackage(
  ownerId: string,
  id: string,
  patch: PackageUpdateInput,
): Promise<Package> {
  const updated = await getDb().packages.update(ownerId, id, {
    ...patch,
    updated_at: new Date().toISOString(),
  } satisfies Patch<Package>);
  if (!updated) throw ApiError.notFound("Pacote não encontrado");
  return updated;
}

/** Equivale ao `ON DELETE RESTRICT` de `bookings.package_id` no schema.sql. */
export async function deletePackage(ownerId: string, id: string): Promise<void> {
  const bookings = await getDb().bookings.list(ownerId);
  if (bookings.some((booking) => booking.package_id === id)) {
    throw ApiError.conflict("Pacote em uso por ensaios. Desative-o em vez de excluir.");
  }
  const removed = await getDb().packages.delete(ownerId, id);
  if (!removed) throw ApiError.notFound("Pacote não encontrado");
}
