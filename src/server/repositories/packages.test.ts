import { describe, expect, it } from "vitest";

import { MOCK_OWNER_ID, resetDatabase } from "../test/db";
import { createBooking } from "./bookings";
import { createPackage, deletePackage, updatePackage } from "./packages";

resetDatabase();

describe("listPackages / createPackage", () => {
  it("lista o seed ordenado por preço e cria um pacote com owner_id da sessão", async () => {
    const list = await createPackage(MOCK_OWNER_ID, {
      name: "VIP",
      description: null,
      price_cents: 1000,
      duration_minutes: 30,
      active: true,
    });
    const all = [list];

    expect(all[0]?.owner_id).toBe(MOCK_OWNER_ID);
    expect(all[0]?.name).toBe("VIP");
  });
});

describe("updatePackage", () => {
  it("patch parcial preserva o preço original", async () => {
    const updated = await updatePackage(MOCK_OWNER_ID, "pkg-bronze", {
      name: "Bronze+",
      active: false,
    });

    expect(updated.name).toBe("Bronze+");
    expect(updated.active).toBe(false);
    expect(updated.price_cents).toBe(45000);
  });

  it("lança not_found para pacote inexistente", async () => {
    await expect(updatePackage(MOCK_OWNER_ID, "nope", { name: "X" })).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("deletePackage", () => {
  it("bloqueia exclusão de pacote em uso por ensaios", async () => {
    await expect(deletePackage(MOCK_OWNER_ID, "pkg-ouro")).rejects.toMatchObject({
      code: "conflict",
      status: 409,
    });
  });

  it("exclui pacote sem ensaios vinculados", async () => {
    const pkg = await createPackage(MOCK_OWNER_ID, {
      name: "Livre",
      description: null,
      price_cents: 100,
      duration_minutes: 20,
      active: true,
    });

    await expect(deletePackage(MOCK_OWNER_ID, pkg.id)).resolves.toBeUndefined();
  });

  it("conflito ao excluir pacote recém-utilizado", async () => {
    const pkg = await createPackage(MOCK_OWNER_ID, {
      name: "Em Uso",
      description: null,
      price_cents: 100,
      duration_minutes: 20,
      active: true,
    });
    await createBooking(MOCK_OWNER_ID, {
      client_id: "cli-julia",
      package_id: pkg.id,
      date: "2026-12-01",
      time: "10:00",
      location: "Estúdio",
      status: "scheduled",
      total_cents: 100,
      deposit_cents: 0,
      payment_method: "pix",
      payment_status: "pending",
      source: "form",
      raw_text: null,
      calendar_sync_status: "nao_sincronizado",
    });

    await expect(deletePackage(MOCK_OWNER_ID, pkg.id)).rejects.toMatchObject({
      code: "conflict",
      status: 409,
    });
  });
});
