import type { ApiErrorBody, ApiErrorCode } from "@/lib/api/contract";

export type { ApiErrorBody, ApiErrorCode };

/**
 * Erro de aplicação com status HTTP e código estável.
 *
 * O corpo de toda resposta de erro segue o envelope:
 *   { "error": { "code": string, "message": string, "fields"?: Record<string, string> } }
 */
export class ApiError extends Error {
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
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  toBody(): ApiErrorBody {
    return this.fields
      ? { error: { code: this.code, message: this.message, fields: this.fields } }
      : { error: { code: this.code, message: this.message } };
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, "bad_request", message);
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, "not_found", message);
  }

  /** Violação de FK/CHECK equivalente às restrições do Postgres (ex.: cliente com ensaios). */
  static conflict(message: string): ApiError {
    return new ApiError(409, "conflict", message);
  }

  static validation(message: string, fields?: Record<string, string>): ApiError {
    return new ApiError(422, "validation_error", message, fields);
  }

  static notImplemented(message: string): ApiError {
    return new ApiError(501, "not_implemented", message);
  }

  static internal(message = "Erro interno"): ApiError {
    return new ApiError(500, "internal_error", message);
  }
}
