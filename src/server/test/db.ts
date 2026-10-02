import { beforeEach } from "vitest";

import { setDb } from "../db";
import { createMemoryAdapter } from "../db/memory";
import { seedSnapshot } from "../db/seed";

/**
 * Recomeça do seed antes de cada teste.
 *
 * Força o driver em memória mesmo que `DATA_DRIVER=file` esteja setado no
 * ambiente, para a suíte nunca depender (ou gravar) no arquivo local.
 */
export function resetDatabase(): void {
  beforeEach(() => {
    setDb(createMemoryAdapter(seedSnapshot()));
  });
}

/** O dono fixo dos dados de seed — use como `ownerId` nos testes de repositório. */
export { MOCK_OWNER_ID } from "../session";
