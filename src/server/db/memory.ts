import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { Booking, Client, Contract, Diagnostic, Invoice, Package } from "@/lib/data/types";
import { stripUndefined } from "../util";
import type { Database, Patch, Table, TableName } from "./adapter";

/** Conteúdo das tabelas — a mesma forma que o `schema.sql` descreve. */
export interface Snapshot {
  clients: Client[];
  packages: Package[];
  bookings: Booking[];
  diagnostics: Diagnostic[];
  contracts: Contract[];
  invoices: Invoice[];
}

type Owned = { id: string; owner_id: string };

/**
 * Adaptador em memória: sustenta o backend inteiro sem nenhuma dependência externa.
 * TODO(supabase): substitua por `SupabaseAdapter` — nada mais muda.
 */
export function createMemoryAdapter(seed: Snapshot): Database {
  let state = clone(seed);
  return buildAdapter(
    () => state,
    (next) => void (state = next),
    seed,
    false,
  );
}

/**
 * Mesmo contrato do adapter em memória, porém gravando num arquivo JSON local.
 * Mantém os cadastros entre restarts do servidor durante o desenvolvimento.
 * TODO(supabase): mantém o comportamento até o banco real existir.
 */
export function createJsonFileAdapter(seed: Snapshot, filePath: string): Database {
  const absolute = resolve(filePath);

  const load = (): Snapshot => {
    try {
      const parsed = JSON.parse(readFileSync(absolute, "utf8")) as Partial<Snapshot>;
      return {
        clients: parsed.clients ?? [],
        packages: parsed.packages ?? [],
        bookings: parsed.bookings ?? [],
        diagnostics: parsed.diagnostics ?? [],
        contracts: parsed.contracts ?? [],
        invoices: parsed.invoices ?? [],
      };
    } catch {
      return clone(seed);
    }
  };

  let state = load();

  return buildAdapter(
    () => state,
    (next) => {
      state = next;
      try {
        mkdirSync(dirname(absolute), { recursive: true });
        writeFileSync(absolute, JSON.stringify(next, null, 2), "utf8");
      } catch (error) {
        // Ambientes sem sistema de arquivos (Cloudflare Workers) não podem
        // derrubar a API: o processo continua em memória.
        console.warn("[db] persistência em arquivo indisponível, seguindo em memória:", error);
      }
    },
    seed,
    true,
  );
}

function buildAdapter(
  get: () => Snapshot,
  set: (next: Snapshot) => void,
  seed: Snapshot,
  persistent: boolean,
): Database {
  const rowsOf = <T extends Owned>(state: Snapshot, name: TableName): T[] =>
    state[name] as unknown as T[];

  const table = <T extends Owned>(name: TableName): Table<T> => ({
    async list(ownerId) {
      return rowsOf<T>(get(), name).filter((row) => row.owner_id === ownerId);
    },
    async get(ownerId, id) {
      return (
        rowsOf<T>(get(), name).find((row) => row.id === id && row.owner_id === ownerId) ?? null
      );
    },
    async insert(row) {
      const state = get();
      if (rowsOf<T>(state, name).some((existing) => existing.id === row.id)) {
        throw new Error(`id duplicado em ${name}: ${row.id}`);
      }
      set({ ...state, [name]: [...rowsOf<T>(state, name), row] });
      return row;
    },
    async update(ownerId, id, patch) {
      const state = get();
      const rows = rowsOf<T>(state, name);
      const index = rows.findIndex((row) => row.id === id && row.owner_id === ownerId);
      const current = index >= 0 ? rows[index] : undefined;
      if (!current) return null;
      // `undefined` significa "não alterar": descartamos antes do spread para
      // não sobrescrever a coluna existente com undefined.
      const updated = { ...current, ...stripUndefined(patch) };
      const next = [...rows];
      next[index] = updated;
      set({ ...state, [name]: next });
      return updated;
    },
    async delete(ownerId, id) {
      const state = get();
      const rows = rowsOf<T>(state, name);
      const remaining = rows.filter((row) => !(row.id === id && row.owner_id === ownerId));
      if (remaining.length === rows.length) return false;
      set({ ...state, [name]: remaining });
      return true;
    },
  });

  return {
    clients: table<Client>("clients"),
    packages: table<Package>("packages"),
    bookings: table<Booking>("bookings"),
    diagnostics: table<Diagnostic>("diagnostics"),
    contracts: table<Contract>("contracts"),
    invoices: table<Invoice>("invoices"),
    persistent,
    reset: async () => set(clone(seed)),
  };
}

function clone(snapshot: Snapshot): Snapshot {
  return structuredClone(snapshot);
}
