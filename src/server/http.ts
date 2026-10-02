import { ApiError, type ApiErrorBody } from "./errors";
import { getSession, type Session } from "./session";

/**
 * Envelopes de resposta e o wrapper `defineHandler`, que centraliza:
 *  - leitura/parse do JSON do body,
 *  - resolução da sessão,
 *  - normalização de erros (Zod, ApiError e inesperados) no envelope de `src/server/errors.ts`.
 *
 * TODO(supabase): quando o Auth entrar, `getSession` passa a validar o JWT e a
 * sessão deixa de ser fixa — nenhuma rota precisa mudar.
 */

export function json<T>(data: T, init?: { status?: number; headers?: HeadersInit }): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json; charset=utf-8", ...init?.headers },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

/** Lê e faz o parse do body JSON; body vazio vira `{}` (útil para PATCH parcial). */
export async function readJson(request: Request): Promise<unknown> {
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    throw ApiError.badRequest("Não foi possível ler o corpo da requisição");
  }
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw ApiError.badRequest("Corpo da requisição não é um JSON válido");
  }
}

function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    const body: ApiErrorBody = error.toBody();
    return json(body, { status: error.status });
  }

  // ZodError chega com `issues`; usamos a forma estrutural para não acoplar
  // este módulo ao schema, que muda junto com o contrato da API.
  const candidate = error as {
    name?: string;
    issues?: Array<{ path: Array<string | number>; message: string }>;
  };
  if (candidate?.name === "ZodError" && Array.isArray(candidate.issues)) {
    const fields: Record<string, string> = {};
    for (const issue of candidate.issues) {
      const key = issue.path.join(".") || "_";
      if (!fields[key]) fields[key] = issue.message;
    }
    return json(ApiError.validation("Dados inválidos", fields).toBody(), { status: 422 });
  }

  console.error("[api] erro não tratado:", error);
  return json(ApiError.internal().toBody(), { status: 500 });
}

export type HandlerContext = {
  params: Record<string, string | undefined>;
  request: Request;
  session: Session;
};

export type Handler = (ctx: HandlerContext) => Promise<Response> | Response;

/**
 * Envolve um handler de rota em `server.handlers` garantindo que nenhum erro
 * escape sem virar resposta JSON no contrato de `src/server/errors.ts`.
 */
export function defineHandler(fn: Handler) {
  return async (ctx: {
    params: Record<string, string | undefined>;
    request: Request;
  }): Promise<Response> => {
    try {
      return await fn({ ...ctx, session: getSession(ctx.request) });
    } catch (error) {
      return errorResponse(error);
    }
  };
}
