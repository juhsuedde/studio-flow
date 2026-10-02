import { describe, expect, it } from "vitest";

import type { BookingInput } from "@/lib/data/types";

import { ApiError } from "../errors";
import { MOCK_OWNER_ID, resetDatabase } from "../test/db";
import { getContract } from "./contracts";
import { getDiagnostic } from "./diagnostics";
import { getInvoice } from "./invoices";
import {
  createBooking,
  deleteBooking,
  getBooking,
  listBookings,
  paymentStatusFor,
  updateBooking,
} from "./bookings";

resetDatabase();

function bookingInput(overrides: Partial<BookingInput> = {}): BookingInput {
  return {
    client_id: "cli-maria",
    package_id: "pkg-ouro",
    date: "2026-11-05",
    time: "08:00",
    location: "Parque Ibirapuera",
    status: "scheduled",
    total_cents: 120000,
    deposit_cents: 0,
    payment_method: "pix",
    payment_status: "pending",
    source: "form",
    raw_text: null,
    calendar_sync_status: "nao_sincronizado",
    ...overrides,
  };
}

describe("createBooking", () => {
  it("grava com owner_id da sessão e id UUID", async () => {
    const booking = await createBooking(MOCK_OWNER_ID, bookingInput());

    expect(booking.owner_id).toBe(MOCK_OWNER_ID);
    expect(booking.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("valida as FKs de reservations antes de gravar (como o Postgres faria)", async () => {
    await expect(
      createBooking(MOCK_OWNER_ID, bookingInput({ client_id: "nao-existe" })),
    ).rejects.toMatchObject({
      code: "validation_error",
      fields: { client_id: "Cliente não encontrada" },
    });
    await expect(
      createBooking(MOCK_OWNER_ID, bookingInput({ package_id: "nao-existe" })),
    ).rejects.toMatchObject({
      code: "validation_error",
      fields: { package_id: "Pacote não encontrado" },
    });
  });

  it("bloqueia depósito maior que o total mesmo chamado direto (CHECK do schema.sql)", async () => {
    let error: unknown;
    try {
      await createBooking(MOCK_OWNER_ID, bookingInput({ total_cents: 1000, deposit_cents: 5000 }));
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ApiError);
    if (error instanceof ApiError) {
      expect(error.code).toBe("validation_error");
      expect(error.fields).toEqual({ deposit_cents: "Entrada maior que o total" });
    }
  });

  it("cria junto do ensaio as linhas 1:1 de diagnostics/contracts/invoices no estado inicial", async () => {
    const created = await createBooking(MOCK_OWNER_ID, bookingInput());

    const reloaded = await getBooking(MOCK_OWNER_ID, created.id);
    expect(reloaded?.diagnostic?.conteudo).toEqual({
      referencias: "",
      looks: "",
      producao: "",
      pendencias: "",
    });
    expect(reloaded?.contract?.status).toBe("nao_gerado");
    expect(reloaded?.invoice?.status).toBe("pendente");
  });
});

describe("updateBooking", () => {
  it("atualiza em parte preservando os demais campos", async () => {
    const updated = await updateBooking(MOCK_OWNER_ID, "bk-2", {
      status: "confirmed",
      payment_status: "paid",
    });

    expect(updated.status).toBe("confirmed");
    expect(updated.payment_status).toBe("paid");
    expect(updated.total_cents).toBe(80000);
  });

  it("avalia o CHECK com o patch combinado ao registro atual", async () => {
    // bk-4: total 45000, depósito 45000. Subir o depósito acima do total
    // de outro campo só é detectado combinando patch + current.
    await expect(
      updateBooking(MOCK_OWNER_ID, "bk-4", { total_cents: 20000 }),
    ).rejects.toMatchObject({
      code: "validation_error",
      fields: { deposit_cents: "Entrada maior que o total" },
    });
  });

  it("recalcula o payment_status derivado quando depósito/total mudam", async () => {
    const paid = await updateBooking(MOCK_OWNER_ID, "bk-2", { deposit_cents: 80000 });
    expect(paid.payment_status).toBe("paid");

    const partial = await updateBooking(MOCK_OWNER_ID, "bk-2", { deposit_cents: 40000 });
    expect(partial.payment_status).toBe("partial");
  });

  it("lança not_found para id inexistente", async () => {
    await expect(
      updateBooking(MOCK_OWNER_ID, "nope", { status: "confirmed" }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("listBookings / getBooking", () => {
  it("lista ordenado por data+horário com relações client/package resolvidas", async () => {
    const bookings = await listBookings(MOCK_OWNER_ID);

    expect(bookings.length).toBe(5);
    const first = bookings[0];
    expect(first?.client?.name).toBe("Maria Oliveira");
    expect(first?.package?.name).toBe("Bronze");
    expect(first?.date).toBe("2026-09-12");
  });

  it("getBooking retorna null para id ausente e não vaza outro dono", async () => {
    expect(await getBooking(MOCK_OWNER_ID, "nope")).toBeNull();
    expect(await getBooking("outro-dono", "bk-1")).toBeNull();
  });
});

describe("deleteBooking", () => {
  it("exclui e lança not_found na segunda tentativa", async () => {
    await deleteBooking(MOCK_OWNER_ID, "bk-3");
    await expect(deleteBooking(MOCK_OWNER_ID, "bk-3")).rejects.toMatchObject({ status: 404 });
  });

  it("remove em cascata as linhas de diagnostics/contracts/invoices (ON DELETE CASCADE)", async () => {
    await deleteBooking(MOCK_OWNER_ID, "bk-3");

    expect(await getDiagnostic(MOCK_OWNER_ID, "bk-3")).toBeNull();
    expect(await getContract(MOCK_OWNER_ID, "bk-3")).toBeNull();
    expect(await getInvoice(MOCK_OWNER_ID, "bk-3")).toBeNull();
  });
});

describe("paymentStatusFor", () => {
  it("deriva o status de pagamento do cruzamento depósito/total", () => {
    expect(paymentStatusFor(120000, 0)).toBe("pending");
    expect(paymentStatusFor(120000, 60000)).toBe("partial");
    expect(paymentStatusFor(120000, 120000)).toBe("paid");
  });
});
