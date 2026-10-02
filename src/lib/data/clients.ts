import { apiRequest } from "@/lib/api/client";
import type { Client, ClientInput } from "./types";

/**
 * Acesso a clientes pela API.
 *
 * A camada de dados continua sendo a porta de entrada da UI (AGENTS.md); o que
 * mudou foi o destino: agora são rotas `/api/clients`, que validam no servidor
 * e persistem no adapter — nada de localStorage.
 */

const BASE = "/api/clients";

export async function listClients(): Promise<Client[]> {
  return apiRequest<Client[]>(BASE);
}

export async function getClient(id: string): Promise<Client | null> {
  return apiRequest<Client>(`${BASE}/${encodeURIComponent(id)}`);
}

export async function createClient(input: ClientInput): Promise<Client> {
  return apiRequest<Client>(BASE, { method: "POST", body: input });
}

export async function updateClient(id: string, input: Partial<ClientInput>): Promise<Client> {
  return apiRequest<Client>(`${BASE}/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
}

/** Retorna 409 quando a cliente tem ensaios vinculados — o botão de excluir trata. */
export async function deleteClient(id: string): Promise<void> {
  await apiRequest<void>(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
