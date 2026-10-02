import type { Booking, Client, Contract, Diagnostic, Invoice, Package } from "@/lib/data/types";

/**
 * Patch parcial onde `undefined` significa "não alterar este campo".
 * É o formato que o Zod devolve em `.partial()`, então os repositórios repassam
 * a saída da validação direto para o adapter sem converter nada.
 */
export type Patch<T> = { [K in keyof T]?: T[K] | undefined };

/**
 * Contrato de persistência do backend.
 *
 * Este é o ÚNICO arquivo que precisa ser reescrito quando o Supabase entrar:
 * `MemoryAdapter`/`JsonFileAdapter` somem e `SupabaseAdapter` passa a falar com
 * `supabase.from("<tabela>")`. Repositórios, validação e rotas não mudam.
 *
 * A interface é propositalmente pequena e igual à do Postgres (tabelas, id,
 * colunas em snake_case) para que a substituição seja mecânica.
 */
export interface Table<T extends { id: string }> {
  /** Todas as linhas visíveis para `ownerId` — equivale a um SELECT sem filtro de owner. */
  list(ownerId: string): Promise<T[]>;
  get(ownerId: string, id: string): Promise<T | null>;
  insert(row: T): Promise<T>;
  update(ownerId: string, id: string, patch: Patch<T>): Promise<T | null>;
  delete(ownerId: string, id: string): Promise<boolean>;
}

export interface Database {
  clients: Table<Client>;
  packages: Table<Package>;
  bookings: Table<Booking>;
  /** Linhas 1:1 com `bookings` — criadas junto do ensaio e deletadas em cascata. */
  diagnostics: Table<Diagnostic>;
  contracts: Table<Contract>;
  invoices: Table<Invoice>;
  /** Descarta os dados e recarrega o seed (uso em desenvolvimento/testes). */
  reset(): Promise<void>;
  /** `true` quando os dados sobrevivem a um restart do processo. */
  readonly persistent: boolean;
}

export const TABLE_NAMES = [
  "clients",
  "packages",
  "bookings",
  "diagnostics",
  "contracts",
  "invoices",
] as const;
export type TableName = (typeof TABLE_NAMES)[number];
