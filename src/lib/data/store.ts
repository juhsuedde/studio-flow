// Armazenamento mock em localStorage.
// TODO(supabase): este arquivo será removido; cada serviço passará a usar
// `supabase.from("<tabela>")` do client gerado em @/integrations/supabase/client.
import { seedBookings, seedClients, seedPackages } from "./seed";

type Table = "clients" | "packages" | "bookings";
const PREFIX = "backoffice:v1:";
const seeds: Record<Table, unknown[]> = {
  clients: seedClients,
  packages: seedPackages,
  bookings: seedBookings,
};

export const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export function readTable<T>(table: Table): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PREFIX + table);
  if (raw === null) {
    window.localStorage.setItem(PREFIX + table, JSON.stringify(seeds[table]));
    return structuredClone(seeds[table]) as T[];
  }
  try {
    return JSON.parse(raw) as T[];
  } catch {
    throw new Error(`Dados corrompidos em ${table}`);
  }
}

export function writeTable<T>(table: Table, rows: T[]) {
  window.localStorage.setItem(PREFIX + table, JSON.stringify(rows));
}

export function resetAll() {
  (Object.keys(seeds) as Table[]).forEach((t) => window.localStorage.removeItem(PREFIX + t));
}

export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
