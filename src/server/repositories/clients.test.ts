import { describe, expect, it } from "vitest";

import { MOCK_OWNER_ID, resetDatabase } from "../test/db";
import { createClient, deleteClient, getClient, listClients, updateClient } from "./clients";
import { createBooking } from "./bookings";
import { createPackage } from "./packages";

resetDatabase();

describe("listClients", () => {
  it("devolve clientes do seed ordenadas por nome em pt-BR", async () => {
    const clients = await listClients(MOCK_OWNER_ID);

    expect(clients.map((client) => client.name)).toEqual([
      "Ana Souza",
      "Júlia Lima",
      "Maria Oliveira",
    ]);
  });

  it("não mistura dados de outro dono", async () => {
    await createClient("outro-dono", {
      name: "Cliente Alheia",
      phone: null,
      email: null,
      cpf: null,
      notes: null,
    });

    expect(
      (await listClients(MOCK_OWNER_ID)).some((client) => client.name === "Cliente Alheia"),
    ).toBe(false);
  });
});

describe("createClient", () => {
  it("grava owner_id vindo da sessão e gera id UUID", async () => {
    const client = await createClient(MOCK_OWNER_ID, {
      name: "Nova",
      phone: null,
      email: "nova@email.com",
      cpf: null,
      notes: null,
    });

    expect(client.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(client.owner_id).toBe(MOCK_OWNER_ID);
    expect(client.name).toBe("Nova");
  });
});

describe("getClient", () => {
  it("retorna null para id inexistente ou de outro dono", async () => {
    expect(await getClient(MOCK_OWNER_ID, "inexistente")).toBeNull();
    expect(await getClient("outro-dono", "cli-maria")).toBeNull();
  });
});

describe("updateClient", () => {
  it("patch parcial não sobrescreve os demais campos", async () => {
    const updated = await updateClient(MOCK_OWNER_ID, "cli-maria", { name: "Maria R." });

    expect(updated.name).toBe("Maria R.");
    expect(updated.phone).toBe("(11) 98765-4321");
  });

  it("lança not_found para id inexistente", async () => {
    await expect(updateClient(MOCK_OWNER_ID, "nope", { name: "X" })).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("deleteClient", () => {
  it("bloqueia exclusão de cliente com ensaios (ON DELETE RESTRICT)", async () => {
    await expect(deleteClient(MOCK_OWNER_ID, "cli-maria")).rejects.toMatchObject({
      code: "conflict",
      status: 409,
    });
  });

  it("exclui cliente sem ensaios", async () => {
    const nova = await createClient(MOCK_OWNER_ID, {
      name: "Sem Ensaios",
      phone: null,
      email: null,
      cpf: null,
      notes: null,
    });

    await expect(deleteClient(MOCK_OWNER_ID, nova.id)).resolves.toBeUndefined();
    expect(await getClient(MOCK_OWNER_ID, nova.id)).toBeNull();
  });

  it("retorna not_found ao excluir id ausente", async () => {
    await expect(deleteClient(MOCK_OWNER_ID, "nope")).rejects.toMatchObject({ status: 404 });
  });
});

describe("regra de exclusão com dados resolvidos", () => {
  it("cliente com ensaio criado no mesmo teste também trava", async () => {
    const pkg = await createPackage(MOCK_OWNER_ID, {
      name: "Flash",
      description: null,
      price_cents: 20000,
      duration_minutes: 30,
      active: true,
    });
    const client = await createClient(MOCK_OWNER_ID, {
      name: "One Shot",
      phone: null,
      email: null,
      cpf: null,
      notes: null,
    });
    await createBooking(MOCK_OWNER_ID, {
      client_id: client.id,
      package_id: pkg.id,
      date: "2026-11-01",
      time: "10:00",
      location: "Estúdio",
      status: "scheduled",
      total_cents: 20000,
      deposit_cents: 0,
      payment_method: "pix",
      payment_status: "pending",
      source: "form",
      raw_text: null,
      calendar_sync_status: "nao_sincronizado",
    });

    await expect(deleteClient(MOCK_OWNER_ID, client.id)).rejects.toMatchObject({
      code: "conflict",
      status: 409,
    });
  });
});
