import { apiRequest } from "@/lib/api/client";
import type { Package, PackageInput } from "./types";

/** Acesso a pacotes pela API — ver `src/lib/data/clients.ts` para o padrão. */

const BASE = "/api/packages";

export async function listPackages(): Promise<Package[]> {
  return apiRequest<Package[]>(BASE);
}

export async function createPackage(input: PackageInput): Promise<Package> {
  return apiRequest<Package>(BASE, { method: "POST", body: input });
}

export async function updatePackage(id: string, input: Partial<PackageInput>): Promise<Package> {
  return apiRequest<Package>(`${BASE}/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
}

/** Retorna 409 quando o pacote está em uso por ensaios. */
export async function deletePackage(id: string): Promise<void> {
  await apiRequest<void>(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
