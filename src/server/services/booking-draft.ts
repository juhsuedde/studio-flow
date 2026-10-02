import { ApiError } from "../errors";
import type { Booking, BookingInput, ClientInput } from "@/lib/data/types";
import type { BookingDraftInput } from "../validation";
import { createBooking, paymentStatusFor, updateBooking } from "../repositories/bookings";
import { createClient, getClient, updateClient } from "../repositories/clients";

/**
 * Pipeline de gravação ÚNICO dos dois modos de cadastro.
 *
 * O formulário guiado e o texto livre entregam o mesmo `BookingDraft` e passam
 * por esta função, então persistem campos idênticos por construção — não por
 * convenção. Alterar um dos dois modos nunca pode divergir do outro.
 *
 * TODO(supabase): isto vira uma única RPC transacional
 * (`save_booking_from_draft`) para que cliente + ensaio gravem juntos; hoje a
 * consistência depende de o adapter não falhar no meio do caminho.
 */

/** Campos que só existem no cadastro — nunca enviados para `clients`. */
function toClientInput(draft: BookingDraftInput): ClientInput {
  return {
    name: draft.clientName,
    phone: draft.clientPhone?.trim() || null,
    email: draft.clientEmail?.trim() || null,
    cpf: draft.clientCpf?.trim() || null,
    notes: null,
  };
}

/** Campos gravados a partir do rascunho; `client_id` e `status` são resolvidos aqui. */
function toBookingInput(draft: BookingDraftInput): Omit<BookingInput, "client_id" | "status"> {
  return {
    package_id: draft.packageId,
    date: draft.date,
    time: draft.time,
    location: draft.location,
    total_cents: draft.totalCents,
    deposit_cents: draft.depositCents,
    payment_method: draft.paymentMethod,
    payment_status: paymentStatusFor(draft.totalCents, draft.depositCents),
    source: draft.source,
    raw_text: draft.rawText?.trim() || null,
    calendar_sync_status: "nao_sincronizado",
  };
}

/**
 * Cria ou atualiza a cliente e o ensaio.
 * `bookingId` ausente cria um ensaio; presente atualiza o existente, sem tocar
 * em `status` — trocar o status é uma ação separada da edição dos dados.
 */
export async function saveBookingDraft(
  ownerId: string,
  draft: BookingDraftInput,
  bookingId?: string,
): Promise<Booking> {
  const clientInput = toClientInput(draft);

  let clientId = draft.clientId ?? null;
  if (clientId) {
    // Falha se a cliente sumiu no meio da edição, evitando criar duplicata silenciosa.
    const existing = await getClient(ownerId, clientId);
    if (!existing)
      throw ApiError.validation("Cliente não encontrada", { clientId: "Cliente não encontrada" });
    await updateClient(ownerId, clientId, clientInput);
  } else {
    clientId = (await createClient(ownerId, clientInput)).id;
  }

  const draftFields = { ...toBookingInput(draft), client_id: clientId };

  if (bookingId) return updateBooking(ownerId, bookingId, draftFields);
  return createBooking(ownerId, { ...draftFields, status: "scheduled" });
}
