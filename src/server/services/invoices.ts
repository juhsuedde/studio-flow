import { ApiError } from "../errors";
import { getBooking } from "../repositories/bookings";
import { countInvoices, getInvoice, upsertInvoice } from "../repositories/invoices";
import type { Invoice } from "@/lib/data/types";

/**
 * Regras de negócio da nota fiscal do ensaio.
 *
 * TODO(edge-function): a emissão vira uma Edge Function que fala com o provedor
 * real de NFe (municipal). Hoje `emitInvoice` emite um "mock" — número
 * sequencial local + data de hoje — para a tela já mostrar o fluxo completo.
 */

/** Emite a nota fiscal do ensaio (hoje: mock sem provedor de NFe). */
export async function emitInvoice(ownerId: string, bookingId: string): Promise<Invoice> {
  const booking = await getBooking(ownerId, bookingId);
  if (!booking) throw ApiError.notFound("Ensaio não encontrado");
  if (booking.status === "cancelled")
    throw ApiError.badRequest("Ensaio cancelado não emite nota fiscal.");

  // Idempotente: nota já emitida não é emitida de novo.
  const existing = await getInvoice(ownerId, bookingId);
  if (existing?.status === "emitida") return existing;

  // TODO(edge-function): chamar o provedor de NFe, persistir número + série +
  // referência e só então marcar "emitida". O número sequencial abaixo é um
  // placeholder até a integração existir.
  const numero = await nextInvoiceNumber(ownerId);
  return upsertInvoice(ownerId, bookingId, {
    status: "emitida",
    numero,
    issued_on: new Date().toISOString().slice(0, 10),
  });
}

async function nextInvoiceNumber(ownerId: string): Promise<string> {
  const count = await countInvoices(ownerId);
  return `NF-${String(count + 1).padStart(4, "0")}`;
}
