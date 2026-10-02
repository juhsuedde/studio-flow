import { createClient, updateClient } from "./clients";
import { delay, now, readTable, uid, writeTable } from "./store";
import type { Booking, BookingDraft, BookingInput, BookingWithRelations, Client, Package, PaymentStatus } from "./types";

function withRelations(rows: Booking[]): BookingWithRelations[] {
  const clients = readTable<Client>("clients");
  const packages = readTable<Package>("packages");
  return rows.map((b) => ({
    ...b,
    client: clients.find((c) => c.id === b.client_id) ?? null,
    package: packages.find((p) => p.id === b.package_id) ?? null,
  }));
}

// TODO(supabase): supabase.from("bookings").select("*, client:clients(*), package:packages(*)").order("date")
export async function listBookings(): Promise<BookingWithRelations[]> {
  await delay();
  const rows = readTable<Booking>("bookings").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return withRelations(rows);
}

// TODO(supabase): mesma query de listBookings com .eq("id", id).single()
export async function getBooking(id: string): Promise<BookingWithRelations | null> {
  await delay(150);
  const row = readTable<Booking>("bookings").find((b) => b.id === id);
  if (!row) return null;
  return withRelations([row])[0] ?? null;
}

// TODO(supabase): supabase.from("bookings").insert(input).select().single()
// TODO(edge-function): após inserir, disparar Edge Function "sync-google-calendar"
// e "generate-contract" (ClickSign) que atualizam calendar_sync_status / contract_status.
export async function createBooking(input: BookingInput): Promise<Booking> {
  await delay();
  const row: Booking = { ...input, id: uid(), owner_id: "mock-owner", created_at: now(), updated_at: now() };
  writeTable("bookings", [...readTable<Booking>("bookings"), row]);
  return row;
}

// TODO(supabase): supabase.from("bookings").update(input).eq("id", id).select().single()
export async function updateBooking(id: string, input: Partial<BookingInput>): Promise<Booking> {
  await delay();
  const rows = readTable<Booking>("bookings");
  const i = rows.findIndex((b) => b.id === id);
  if (i < 0) throw new Error("Ensaio não encontrado");
  const current = rows[i];
  if (!current) throw new Error("Ensaio não encontrado");
  const updated: Booking = { ...current, ...input, updated_at: now() };
  rows[i] = updated;
  writeTable("bookings", rows);
  return updated;
}

// TODO(supabase): supabase.from("bookings").delete().eq("id", id)
export async function deleteBooking(id: string): Promise<void> {
  await delay();
  writeTable("bookings", readTable<Booking>("bookings").filter((b) => b.id !== id));
}

const paymentStatusFor = (total: number, deposit: number): PaymentStatus =>
  deposit <= 0 ? "pending" : deposit >= total ? "paid" : "partial";

/**
 * Salva um rascunho vindo de qualquer um dos dois modos de cadastro.
 * Cria/atualiza a cliente e cria/atualiza o ensaio.
 * TODO(supabase): substituir por uma RPC transacional `save_booking_from_draft`.
 */
export async function saveBookingDraft(draft: BookingDraft, bookingId?: string): Promise<Booking> {
  const clientInput = {
    name: draft.clientName.trim(),
    phone: draft.clientPhone.trim() || null,
    email: draft.clientEmail.trim() || null,
    cpf: draft.clientCpf.trim() || null,
  };
  let clientId = draft.clientId;
  if (clientId) {
    await updateClient(clientId, clientInput);
  } else {
    const c = await createClient({ ...clientInput, notes: null });
    clientId = c.id;
  }
  const input = {
    client_id: clientId,
    package_id: draft.packageId,
    date: draft.date,
    time: draft.time,
    location: draft.location.trim(),
    total_cents: draft.totalCents,
    deposit_cents: draft.depositCents,
    payment_method: draft.paymentMethod || "pix",
    payment_status: paymentStatusFor(draft.totalCents, draft.depositCents),
    source: draft.source,
    raw_text: draft.rawText || null,
  } as const;
  if (bookingId) return updateBooking(bookingId, input);
  return createBooking({
    ...input,
    status: "scheduled",
    calendar_sync_status: "not_started",
    contract_status: "not_started",
    invoice_status: "not_started",
  });
}

export function bookingToDraft(b: BookingWithRelations): BookingDraft {
  return {
    clientId: b.client_id,
    clientName: b.client?.name ?? "",
    clientPhone: b.client?.phone ?? "",
    clientEmail: b.client?.email ?? "",
    clientCpf: b.client?.cpf ?? "",
    packageId: b.package_id,
    date: b.date,
    time: b.time,
    location: b.location,
    totalCents: b.total_cents,
    paymentMethod: b.payment_method,
    depositCents: b.deposit_cents,
    source: b.source,
    rawText: b.raw_text ?? "",
  };
}
