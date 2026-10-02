import { describe, expect, it } from "vitest";

import {
  bookingCreateSchema,
  bookingDraftSchema,
  clientCreateSchema,
  extractRequestSchema,
  packageCreateSchema,
} from "./validation";

describe("clientCreateSchema", () => {
  it("aparada o nome e normaliza o CPF para apenas dígitos", () => {
    const result = clientCreateSchema.parse({
      name: "  Beatriz Costa  ",
      email: "bia@email.com",
      cpf: "987.654.321-00",
    });

    expect(result.name).toBe("Beatriz Costa");
    expect(result.cpf).toBe("98765432100");
  });

  it("rejeita nome vazio, e-mail inválido e CPF com número errado de dígitos", () => {
    const result = clientCreateSchema.safeParse({ name: "  ", email: "nao-e-email", cpf: "1234" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.name).toBeDefined();
      expect(fields.email).toBeDefined();
      expect(fields.cpf).toBeDefined();
    }
  });

  it("CPF vazio é permitido (nem toda cliente tem)", () => {
    const result = clientCreateSchema.parse({ name: "Ana" });
    expect(result.cpf).toBeNull();
  });

  it("telefone só de espaços vira null, não string vazia", () => {
    const result = clientCreateSchema.parse({ name: "Ana", phone: "   " });
    expect(result.phone).toBeNull();
  });
});

describe("packageCreateSchema", () => {
  it("aceita um pacote válido com preço em centavos inteiros", () => {
    const result = packageCreateSchema.parse({
      name: "Bronze",
      price_cents: 45000,
      duration_minutes: 60,
    });

    expect(result.active).toBe(true);
    expect(result.price_cents).toBe(45000);
  });

  it("rejeita preço negativo e duração não inteira", () => {
    expect(
      packageCreateSchema.safeParse({ name: "X", price_cents: -1, duration_minutes: 60 }).success,
    ).toBe(false);
    expect(
      packageCreateSchema.safeParse({ name: "X", price_cents: 100, duration_minutes: 1.5 }).success,
    ).toBe(false);
  });
});

describe("bookingCreateSchema", () => {
  const valid = {
    client_id: "cli-maria",
    package_id: "pkg-ouro",
    date: "2026-11-05",
    time: "08:00",
    location: "Parque Ibirapuera",
    total_cents: 120000,
    payment_method: "pix",
  } as const;

  it("preenche os defaults esperados pelo schema.sql", () => {
    const result = bookingCreateSchema.parse(valid);

    expect(result.status).toBe("scheduled");
    expect(result.deposit_cents).toBe(0);
    expect(result.payment_status).toBe("pending");
    expect(result.source).toBe("form");
  });

  it("rejeita entrada maior que o total (CHECK do schema.sql)", () => {
    const result = bookingCreateSchema.safeParse({ ...valid, deposit_cents: 1_000_000 });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toContain("deposit_cents");
  });

  it("rejeita data inexistente (ex.: 31/02) e horário fora do formato", () => {
    expect(bookingCreateSchema.safeParse({ ...valid, date: "2026-02-31" }).success).toBe(false);
    expect(bookingCreateSchema.safeParse({ ...valid, time: "25:00" }).success).toBe(false);
  });
});

describe("bookingDraftSchema", () => {
  const valid = {
    clientName: "Maria Oliveira",
    packageId: "pkg-ouro",
    date: "2026-11-05",
    time: "15:00",
    location: "Estúdio",
    totalCents: 120000,
    paymentMethod: "pix",
    depositCents: 60000,
  } as const;

  it("aceita o rascunho completo dos dois modos de cadastro", () => {
    expect(bookingDraftSchema.parse(valid).source).toBe("form");
  });

  it("rejeita depósito maior que o total apontando `depositCents`", () => {
    const result = bookingDraftSchema.safeParse({ ...valid, totalCents: 0, depositCents: 1 });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toContain("depositCents");
  });
});

describe("extractRequestSchema", () => {
  it("rejeita texto vazio", () => {
    expect(extractRequestSchema.safeParse({ text: "  " }).success).toBe(false);
  });

  it("aceita rascunho parcial com campos em branco (form ainda pela metade)", () => {
    const result = extractRequestSchema.safeParse({
      text: "Pacote Prata, dia 12",
      draft: { clientName: "Manteve o nome", location: "", paymentMethod: "", source: "ai_text" },
    });

    expect(result.success).toBe(true);
  });
});
