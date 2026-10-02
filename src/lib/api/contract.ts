/**
 * Contrato de erro da API, compartilhado entre servidor e cliente.
 *
 * Fica fora de `src/server/` de propósito: é o único pedaço do protocolo que a
 * UI precisa conhecer, e o cliente importa só tipos (nada de runtime do
 * servidor entra no bundle).
 */
export type ApiErrorCode =
  | "bad_request"
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "not_implemented"
  | "internal_error";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
}
