import { describe, expect, it } from "vitest";

import { MOCK_OWNER_ID, resetDatabase } from "../test/db";
import { listClients } from "../repositories/clients";
import { getBooking, listBookings } from "../repositories/bookings";
import type { BookingDraftInput } from "../validation";
import { saveBookingDraft } from "./booking-draft";

resetDatabase();

const draft = (overrides: Partial<BookingDraftInput> = {}): BookingDraftInput => ({
  clientId: null,
  clientName: "Carla Nunes",
  clientPhone: "(11) 90000-1111",
  clientEmail: "",
  clientCpf: "",
  packageId: "pkg-prata",
  date: "2026-11-05",
  time: "08:00",
  location: "Estúdio Pinheiros",
  totalCents: 80000,
  paymentMethod: "pix",
  depositCents: 40000,
  source: "form",
  rawText: "",
  ...overrides,
});

describe("saveBookingDraft (formulário e texto livre, mesmo pipeline)", () => {
  it("cria cliente + ensaio; source form e ai_text persistem os mesmos campos", async () => {
    const fromForm = await saveBookingDraft(MOCK_OWNER_ID, draft());
    const fromText = await saveBookingDraft(
      MOCK_OWNER_ID,
      draft({ source: "ai_text", rawText: "Ensaio da Carla" }),
    );

    for (const booking of [fromForm, fromText]) {
      expect(booking.status).toBe("scheduled");
      expect(booking.total_cents).toBe(80000);
      expect(booking.deposit_cents).toBe(40000);
      expect(booking.payment_status).toBe("partial");
    }
    expect(fromForm.source).toBe("form");
    expect(fromText.source).toBe("ai_text");
    expect(fromText.raw_text).toBe("Ensaio da Carla");
  });

  it("sem clientId, cada rascunho cria sua própria cliente (dedupe é papel da UI, via clientId)", async () => {
    await saveBookingDraft(MOCK_OWNER_ID, draft());
    await saveBookingDraft(MOCK_OWNER_ID, draft({ date: "2026-12-01", packageId: "pkg-bronze" }));

    const carlas = (await listClients(MOCK_OWNER_ID)).filter(
      (client) => client.name === "Carla Nunes",
    );
    expect(carlas.length).toBe(2);
  });

  it("mesmo clientId em rascunhos diferentes nunca cria duplicata", async () => {
    const anaId = (await listClients(MOCK_OWNER_ID)).find(
      (client) => client.name === "Ana Souza",
    )?.id;

    await saveBookingDraft(MOCK_OWNER_ID, draft({ clientId: anaId ?? null }));
    await saveBookingDraft(
      MOCK_OWNER_ID,
      draft({ clientId: anaId ?? null, date: "2026-12-01", packageId: "pkg-bronze" }),
    );

    expect((await listClients(MOCK_OWNER_ID)).filter((client) => client.id === anaId).length).toBe(
      1,
    );
  });

  it("com clientId informado, atualiza a cliente em vez de criar outra", async () => {
    const before = await listClients(MOCK_OWNER_ID);
    const cliAnaId = before.find((client) => client.name === "Ana Souza")?.id;

    await saveBookingDraft(
      MOCK_OWNER_ID,
      draft({ clientId: cliAnaId ?? null, clientName: "Ana S." }),
    );

    const after = await listClients(MOCK_OWNER_ID);
    expect(after.filter((client) => client.name === "Ana S.").length).toBe(1);
    expect(after.filter((client) => client.name === "Ana Souza").length).toBe(0);
  });

  it("clientId inexistente falha em vez de criar duplicata silenciosa", async () => {
    await expect(
      saveBookingDraft(MOCK_OWNER_ID, draft({ clientId: "sumida" })),
    ).rejects.toMatchObject({
      code: "validation_error",
      fields: { clientId: "Cliente não encontrada" },
    });
  });

  it("com bookingId atualiza o ensaio existente e não cria outro", async () => {
    const updated = await saveBookingDraft(
      MOCK_OWNER_ID,
      draft({ clientId: "cli-maria", location: "Novo local" }),
      "bk-1",
    );

    expect(updated.id).toBe("bk-1");
    expect(updated.location).toBe("Novo local");
    expect((await listBookings(MOCK_OWNER_ID)).length).toBe(5);
    const reloaded = await getBooking(MOCK_OWNER_ID, "bk-1");
    expect(reloaded?.location).toBe("Novo local");
  });
});
