import type { ApiErrorBody, ApiErrorCode } from "./contract";

/**
 * Cliente HTTP da aplicação.
 *
 * A UI nunca fala com o storage nem com o banco: passa por aqui e chega nas
 * rotas `/api/*`, que são o contrato do backend. Os nomes exportados por
 * `src/lib/data/*` continuam os mesmos, então trocar o mock pela API não
 * obrigou nenhum componente a mudar.
 *
 * TODO(supabase): nenhuma mudança aqui — o backend já é o Supabase por baixo,
 * o cliente HTTP continua igual.
 */

/** Erro normalizado vindo do envelope de `src/server/errors.ts`. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields: Record<string, string> | undefined;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

/**
 * URL absoluta no servidor, relativa no navegador: `fetch` do Node não aceita
 * caminho sem origem, e os loaders podem rodar durante o SSR.
 */
function resolveUrl(path: string): string {
  if (typeof window !== "undefined") return path;
  const origin = globalThis.location?.origin;
  return origin ? `${origin}${path}` : path;
}

async function toError(response: Response): Promise<ApiRequestError> {
  let body: Partial<ApiErrorBody> | undefined;
  try {
    body = (await response.json()) as Partial<ApiErrorBody>;
  } catch {
    // Resposta sem JSON (proxy/erro de rede): cai no erro genérico abaixo.
  }
  const error = body?.error;
  return new ApiRequestError(
    response.status,
    error?.code ?? "internal_error",
    error?.message ?? "Não foi possível completar a requisição",
    error?.fields,
  );
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  // `exactOptionalPropertyTypes` não aceita `undefined` explícito em RequestInit,
  // então montamos o objeto só com as chaves que realmente existem.
  const init: RequestInit = { method };
  if (signal) init.signal = signal;
  if (body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(resolveUrl(path), init);
  } catch {
    // Falha de rede: o servidor está fora do ar, não é erro de validação.
    throw new ApiRequestError(0, "internal_error", "Servidor indisponível. Verifique sua conexão.");
  }

  if (!response.ok) throw await toError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
