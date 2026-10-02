import { resolve } from "node:path";

import type { Database } from "./adapter";
import { createJsonFileAdapter, createMemoryAdapter } from "./memory";
import { seedSnapshot } from "./seed";

/**
 * Instância única do banco para o processo do servidor.
 *
 * `DB_DRIVER=memory` (padrão) mantém tudo em memória; `DB_DRIVER=file` grava num
 * JSON local para preservar cadastros entre restarts durante o desenvolvimento.
 * TODO(supabase): com o Supabase conectado, este arquivo passa a devolver o
 * client do Postgres e as variáveis abaixo viram apenas fallback de desenvolvimento.
 */

const DATA_FILE = ".data/studio-flow.json";

let instance: Database | undefined;

function createDatabase(): Database {
  const driver = process.env["DATA_DRIVER"] ?? "memory";
  const seed = seedSnapshot();
  if (driver === "file") return createJsonFileAdapter(seed, resolve(process.cwd(), DATA_FILE));
  return createMemoryAdapter(seed);
}

export function getDb(): Database {
  instance ??= createDatabase();
  return instance;
}

/** Usado em testes para partir sempre do seed, sem reaproveitar estado do processo. */
export function setDb(db: Database): void {
  instance = db;
}

export type { Database };
