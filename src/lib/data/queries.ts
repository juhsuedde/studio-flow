import { queryOptions } from "@tanstack/react-query";
import { getBooking, listBookings } from "./bookings";
import { listClients } from "./clients";
import { listPackages } from "./packages";

/**
 * Definições de query compartilhadas por loaders e componentes, para que a mesma
 * chave seja usada em todo lugar e a invalidação cubra a tela inteira.
 *
 * `staleTime` curto porque o back-office é usado por uma pessoa só, em abas
 * diferentes: frescor vale mais do queldr quantidade de requisições.
 */

export const bookingsQuery = queryOptions({
  queryKey: ["bookings"],
  queryFn: listBookings,
  staleTime: 15_000,
});
export const bookingQuery = (id: string) =>
  queryOptions({ queryKey: ["bookings", id], queryFn: () => getBooking(id), staleTime: 15_000 });
export const clientsQuery = queryOptions({
  queryKey: ["clients"],
  queryFn: listClients,
  staleTime: 30_000,
});
export const packagesQuery = queryOptions({
  queryKey: ["packages"],
  queryFn: listPackages,
  staleTime: 60_000,
});
