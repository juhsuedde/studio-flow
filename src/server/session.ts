// Seam de autenticação. Nenhuma rota de API deve ler cookies/tokens direto:
// todas passam por `getSession`, que é o único ponto a trocar quando o login existir.
//
// TODO(auth): quando o Supabase Auth for habilitado —
//   1. ler o cookie de sessão e validar com `supabase.auth.getUser(token)`;
//   2. devolver `{ user: null }` (HTTP 401) quando não houver sessão válida;
//   3. manter `owner_id` sempre vindo daqui, nunca do corpo da requisição
//      (o RLS de `schema.sql` é a fonte de verdade do escopo por usuário).
// Nada mais precisa mudar: os repositórios já filtram por `session.user.id`.

import { ApiError } from "./errors";

export interface SessionUser {
  id: string;
  email: string | null;
}

/** `user: null` representa requisição anônima; rotas que exigem login usam `requireUser`. */
export interface Session {
  user: SessionUser | null;
  /** `mock` enquanto não existe Supabase Auth; vira `supabase` junto com o Auth. */
  provider: "mock" | "supabase";
  /** Marca se a sessão é fixa — a UI usa para avisar que está em modo demonstração. */
  isGuest: boolean;
}

/** Dono único dos dados enquanto o app roda sem multiusuário. */
export const MOCK_OWNER_ID = "00000000-0000-0000-0000-000000000001";

const MOCK_USER: SessionUser = { id: MOCK_OWNER_ID, email: "estudio@local.dev" };

export function getSession(_request: Request): Session {
  // TODO(auth): substituir por validação real do JWT (ver nota no topo do arquivo).
  return { user: MOCK_USER, provider: "mock", isGuest: true };
}

export function requireUser(session: Session): SessionUser {
  if (!session.user) {
    throw new ApiError(401, "unauthorized", "Sessão expirada. Entre novamente.");
  }
  return session.user;
}
