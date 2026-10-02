import { apiRequest } from "@/lib/api/client";
import type {
  Booking,
  BookingDraft,
  BookingInput,
  BookingWithRelations,
  Contract,
  Diagnostic,
  DiagnosticContent,
  Invoice,
} from "./types";

/**
 * Acesso a ensaios pela API.
 *
 * `saveBookingDraft` não monta o payload no cliente: ele manda o `BookingDraft`
 * cru para `PUT /api/bookings/from-draft`, e o servidor resolve cliente +
 * pagamento + integrações. É o que garante que o formulário guiado e o texto
 * livre gravem exatamente os mesmos campos (AGENTS.md).
 */

const BASE = "/api/bookings";

export async function listBookings(): Promise<BookingWithRelations[]> {
  return apiRequest<BookingWithRelations[]>(BASE);
}

export async function getBooking(id: string): Promise<BookingWithRelations | null> {
  return apiRequest<BookingWithRelations>(`${BASE}/${encodeURIComponent(id)}`);
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  return apiRequest<Booking>(BASE, { method: "POST", body: input });
}

export async function updateBooking(id: string, input: Partial<BookingInput>): Promise<Booking> {
  return apiRequest<Booking>(`${BASE}/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
}

export async function deleteBooking(id: string): Promise<void> {
  await apiRequest<void>(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Salva o `conteudo` (jsonb) das seções do diagnóstico do ensaio. */
export async function saveDiagnostic(id: string, conteudo: DiagnosticContent): Promise<Diagnostic> {
  return apiRequest<Diagnostic>(`${BASE}/${encodeURIComponent(id)}/diagnostic`, {
    method: "PUT",
    body: { conteudo },
  });
}

/** Muda o contrato do ensaio para `gerado` (hoje sem PDF real — ver TODO no serviço). */
export async function generateContract(id: string): Promise<Contract> {
  return apiRequest<Contract>(`${BASE}/${encodeURIComponent(id)}/generate-contract`, {
    method: "POST",
  });
}

/** Emite a nota fiscal do ensaio (hoje mock sem NFe real — ver TODO no serviço). */
export async function emitInvoice(id: string): Promise<Invoice> {
  return apiRequest<Invoice>(`${BASE}/${encodeURIComponent(id)}/emit-invoice`, {
    method: "POST",
  });
}

/** Salva o rascunho de qualquer um dos dois modos de cadastro. */
export async function saveBookingDraft(draft: BookingDraft, bookingId?: string): Promise<Booking> {
  return apiRequest<Booking>(`${BASE}/from-draft`, { method: "PUT", body: { draft, bookingId } });
}

/** Ensaio → rascunho, para abrir o formulário de edição já preenchido. */
export function bookingToDraft(booking: BookingWithRelations): BookingDraft {
  return {
    clientId: booking.client_id,
    clientName: booking.client?.name ?? "",
    clientPhone: booking.client?.phone ?? "",
    clientEmail: booking.client?.email ?? "",
    clientCpf: booking.client?.cpf ?? "",
    packageId: booking.package_id,
    date: booking.date,
    time: booking.time,
    location: booking.location,
    totalCents: booking.total_cents,
    paymentMethod: booking.payment_method,
    depositCents: booking.deposit_cents,
    source: booking.source,
    rawText: booking.raw_text ?? "",
  };
}
