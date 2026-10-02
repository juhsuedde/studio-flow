import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "./errors";
import { defineHandler, json, noContent, readJson } from "./http";

describe("defineHandler", () => {
  it("devolve a resposta JSON direto em caso de sucesso", async () => {
    const handler = defineHandler(async () => json({ ok: true }));
    const response = await handler({ params: {}, request: new Request("http://local/api/x") });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("resposta 204 não tem corpo", async () => {
    const handler = defineHandler(() => noContent());
    const response = await handler({ params: {}, request: new Request("http://local/api/x") });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("injeta a sessão mock no handler", async () => {
    const handler = defineHandler(async ({ session }) => json({ id: session.user?.id ?? null }));
    const response = await handler({ params: {}, request: new Request("http://local/api/x") });
    const body = (await response.json()) as { id: string };

    expect(body.id).toBe("00000000-0000-0000-0000-000000000001");
  });

  it("converte ApiError no envelope de erro contratado", async () => {
    const handler = defineHandler(async () => {
      throw ApiError.conflict("Pacote em uso");
    });
    const response = await handler({ params: {}, request: new Request("http://local/api/x") });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: { code: "conflict", message: "Pacote em uso" },
    });
  });

  it("converte ZodError no envelope 422 com campos mapeados", async () => {
    const schema = z.object({
      name: z.string().min(1, "Informe o nome"),
      email: z.string().email("E-mail inválido"),
    });
    const handler = defineHandler(async () => json(schema.parse({ name: "", email: "x" })));
    const response = await handler({ params: {}, request: new Request("http://local/api/x") });

    expect(response.status).toBe(422);
    const body = (await response.json()) as {
      error: { code: string; fields: Record<string, string> };
    };
    expect(body.error.code).toBe("validation_error");
    expect(body.error.fields["name"]).toBe("Informe o nome");
    expect(body.error.fields["email"]).toBe("E-mail inválido");
  });

  it("erro inesperado vira 500 sem vazar o stack", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const handler = defineHandler(async () => {
      throw new Error("segredo interno");
    });
    const response = await handler({ params: {}, request: new Request("http://local/api/x") });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: "internal_error", message: "Erro interno" },
    });
    warn.mockRestore();
  });
});

describe("readJson", () => {
  it("corpo vazio vira {} (útil para PATCH parcial)", async () => {
    expect(await readJson(new Request("http://local", { method: "POST" }))).toEqual({});
  });

  it("JSON inválido vira bad_request", async () => {
    const request = new Request("http://local", { method: "POST", body: "{quebrado" });
    await expect(readJson(request)).rejects.toThrow(/JSON/);
  });
});
