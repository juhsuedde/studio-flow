import { ApiError } from "../errors";
import { getBooking } from "../repositories/bookings";
import { getContract, upsertContract } from "../repositories/contracts";
import type { Contract } from "@/lib/data/types";

/**
 * Regras de negócio do contrato do ensaio.
 *
 * TODO(edge-function): a geração do contrato vira uma Edge Function (ex.:
 * ClickSign/Docuseal). Hoje `generateContract` só troca o status — a função
 * abaixo marca os pontos onde a chamada real entra, sem mudar a tela.
 */

/** Gera o contrato do ensaio (hoje: apenas muda o status para `gerado`). */
export async function generateContract(ownerId: string, bookingId: string): Promise<Contract> {
  const booking = await getBooking(ownerId, bookingId);
  if (!booking) throw ApiError.notFound("Ensaio não encontrado");
  if (booking.status === "cancelled")
    throw ApiError.badRequest("Ensaio cancelado não gera contrato.");

  // Idempotente: já gerado/enviado/assinado não volta para "gerado".
  const existing = await getContract(ownerId, bookingId);
  if (existing && existing.status !== "nao_gerado") return existing;

  // TODO(edge-function): gerar o PDF real com os dados de booking + cliente +
  // pacote (nome, CPF, data, local, valores) e salvar a URL; só então marcar
  // como "gerado". Por enquanto mudamos apenas o status para manter o fluxo.
  return upsertContract(ownerId, bookingId, "gerado");
}
