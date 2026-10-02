import { ApiError } from "../errors";
import { getDb } from "../db";
import type { Table } from "../db/adapter";
import {
  emptyDiagnosticContent,
  type Booking,
  type BookingInput,
  type BookingWithRelations,
  type PaymentStatus,
} from "@/lib/data/types";
import type { Patch } from "../db/adapter";
import { DEPOSIT_EXCEEDS_TOTAL, type BookingUpdateInput } from "../validation";

/**
 * Acesso a `bookings`, sempre filtrado por `ownerId`, com as relações
 * `client`/`package`/`diagnostic`/`contract`/`invoice` resolvidas no servidor
 * (equivalente ao embed do PostgREST:
 * `select("*, client:clients(*), package:packages(*), diagnostic:diagnostics(*), contract:contracts(*), invoice:invoices(*)")`).
 *
 * TODO(supabase): as listagens passam a usar
 * `supabase.from("bookings").select("..., diagnostic:diagnostics(*), ...")`.
 * Para a listagem completa, prefira uma view (ex.: `bookings_with_relations`)
 * em vez de N+1 — o repositório atual resolve tudo em memória.
 */

async function withRelations(ownerId: string, rows: Booking[]): Promise<BookingWithRelations[]> {
  if (rows.length === 0) return [];
  const [clients, packages, diagnostics, contracts, invoices] = await Promise.all([
    getDb().clients.list(ownerId),
    getDb().packages.list(ownerId),
    getDb().diagnostics.list(ownerId),
    getDb().contracts.list(ownerId),
    getDb().invoices.list(ownerId),
  ]);
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const packageById = new Map(packages.map((pkg) => [pkg.id, pkg]));
  const diagnosticByBooking = new Map(diagnostics.map((row) => [row.booking_id, row]));
  const contractByBooking = new Map(contracts.map((row) => [row.booking_id, row]));
  const invoiceByBooking = new Map(invoices.map((row) => [row.booking_id, row]));
  return rows.map((row) => ({
    ...row,
    client: clientById.get(row.client_id) ?? null,
    package: packageById.get(row.package_id) ?? null,
    diagnostic: diagnosticByBooking.get(row.id) ?? null,
    contract: contractByBooking.get(row.id) ?? null,
    invoice: invoiceByBooking.get(row.id) ?? null,
  }));
}

const bySchedule = (a: Booking, b: Booking) =>
  `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);

export async function listBookings(ownerId: string): Promise<BookingWithRelations[]> {
  const rows = await getDb().bookings.list(ownerId);
  return withRelations(ownerId, rows.sort(bySchedule));
}

export async function getBooking(
  ownerId: string,
  id: string,
): Promise<BookingWithRelations | null> {
  const row = await getDb().bookings.get(ownerId, id);
  if (!row) return null;
  const [withRelation] = await withRelations(ownerId, [row]);
  return withRelation ?? null;
}

/** Foreign keys de `bookings` validadas antes da escrita, como faria o Postgres. */
async function assertRelationsExist(
  ownerId: string,
  clientId: string,
  packageId: string,
): Promise<void> {
  const [client, pkg] = await Promise.all([
    getDb().clients.get(ownerId, clientId),
    getDb().packages.get(ownerId, packageId),
  ]);
  if (!client)
    throw ApiError.validation("Cliente não encontrada", { client_id: "Cliente não encontrada" });
  if (!pkg)
    throw ApiError.validation("Pacote não encontrado", { package_id: "Pacote não encontrado" });
}

export async function createBooking(ownerId: string, input: BookingInput): Promise<Booking> {
  await assertRelationsExist(ownerId, input.client_id, input.package_id);
  assertDepositWithinTotal(input.deposit_cents, input.total_cents);
  const timestamp = new Date().toISOString();
  const row: Booking = {
    ...input,
    owner_id: ownerId,
    id: crypto.randomUUID(),
    created_at: timestamp,
    updated_at: timestamp,
  };
  const booking = await getDb().bookings.insert(row);
  await createIntegrationRows(ownerId, booking.id);
  return booking;
}

/**
 * Juntas do ensaio vêm as linhas 1:1 de diagnostics/contracts/invoices no
 * estado inicial — o espelho do `ON DELETE CASCADE` e dos `default` do schema.
 * Cria todas em paralelo porque uma não depende da outra.
 */
async function createIntegrationRows(ownerId: string, bookingId: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await Promise.all([
    getDb().diagnostics.insert({
      id: crypto.randomUUID(),
      owner_id: ownerId,
      booking_id: bookingId,
      conteudo: emptyDiagnosticContent(),
      created_at: timestamp,
      updated_at: timestamp,
    }),
    getDb().contracts.insert({
      id: crypto.randomUUID(),
      owner_id: ownerId,
      booking_id: bookingId,
      status: "nao_gerado",
      created_at: timestamp,
      updated_at: timestamp,
    }),
    getDb().invoices.insert({
      id: crypto.randomUUID(),
      owner_id: ownerId,
      booking_id: bookingId,
      status: "pendente",
      numero: null,
      issued_on: null,
      created_at: timestamp,
      updated_at: timestamp,
    }),
  ]);
}

export async function updateBooking(
  ownerId: string,
  id: string,
  patch: BookingUpdateInput,
): Promise<Booking> {
  const current = await getDb().bookings.get(ownerId, id);
  if (!current) throw ApiError.notFound("Ensaio não encontrado");
  await assertRelationsExist(
    ownerId,
    patch.client_id ?? current.client_id,
    patch.package_id ?? current.package_id,
  );

  // O CHECK `deposit_cents <= total_cents` também vale na edição, e só pode ser
  // avaliado com o registro já combinado (patch parcial + valores atuais).
  const total = patch.total_cents ?? current.total_cents;
  const deposit = patch.deposit_cents ?? current.deposit_cents;
  assertDepositWithinTotal(deposit, total);

  // `payment_status` é derivado de depósito/total: qualquer mudança nesses
  // valores recalcula o status, para o valor nunca descolar da realidade.
  const moneyChanged = patch.total_cents !== undefined || patch.deposit_cents !== undefined;

  const updated = await getDb().bookings.update(ownerId, id, {
    ...patch,
    ...(moneyChanged ? { payment_status: paymentStatusFor(total, deposit) } : {}),
    updated_at: new Date().toISOString(),
  } satisfies Patch<Booking>);
  if (!updated) throw ApiError.notFound("Ensaio não encontrado");
  return updated;
}

/**
 * Invariante do CHECK `deposit_cents <= total_cents`. Repetida aqui (além do
 * schema do Zod) porque qualquer chamada futura ao repositório precisa respeitá-la
 * — no Postgres quem garantiria isso é o próprio banco.
 */
function assertDepositWithinTotal(depositCents: number, totalCents: number): void {
  if (depositCents > totalCents) {
    throw ApiError.validation(DEPOSIT_EXCEEDS_TOTAL, { deposit_cents: DEPOSIT_EXCEEDS_TOTAL });
  }
}

export async function deleteBooking(ownerId: string, id: string): Promise<void> {
  const removed = await getDb().bookings.delete(ownerId, id);
  if (!removed) throw ApiError.notFound("Ensaio não encontrado");
  // Igual ao `ON DELETE CASCADE` de diagnostics/contracts/invoices do schema.sql.
  await Promise.all([
    removeByBooking(getDb().diagnostics, ownerId, id),
    removeByBooking(getDb().contracts, ownerId, id),
    removeByBooking(getDb().invoices, ownerId, id),
  ]);
}

/** Remove as linhas de uma tabela 1:1 que apontam para o ensaio deletado. */
async function removeByBooking<T extends { id: string; owner_id: string; booking_id: string }>(
  table: Table<T>,
  ownerId: string,
  bookingId: string,
): Promise<void> {
  const rows = await table.list(ownerId);
  await Promise.all(
    rows.filter((row) => row.booking_id === bookingId).map((row) => table.delete(ownerId, row.id)),
  );
}

/**
 * Entrada paga vira `paid`, parcial vira `partial`, ausente vira `pending`.
 * Regra derivada do cruzamento entre `deposit_cents` e `total_cents` — o
 * schema.sql guarda os três estados, mas quem calcula é a aplicação.
 */
export function paymentStatusFor(totalCents: number, depositCents: number): PaymentStatus {
  if (depositCents <= 0) return "pending";
  return depositCents >= totalCents ? "paid" : "partial";
}
