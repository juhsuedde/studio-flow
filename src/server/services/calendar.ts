import { ApiError } from "../errors";

/**
 * Integração com o Google Calendar — o botão da ficha fica desabilitado na UI
 * até a Edge Function existir. A função abaixo é o ponto onde a chamada real
 * entra, sem a tela precisar mudar.
 *
 * TODO(edge-function): criar o evento no Google Calendar com data/hora/local do
 * ensaio, adicionar convidados e atualizar
 * `bookings.calendar_sync_status` para `sincronizado`.
 */
export async function syncCalendarEvent(_ownerId: string, _bookingId: string): Promise<never> {
  throw ApiError.notImplemented("Sincronizar com o Google Calendar estará disponível em breve.");
}
