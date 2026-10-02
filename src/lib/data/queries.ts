import { queryOptions } from "@tanstack/react-query";
import { getBooking, listBookings } from "./bookings";
import { listClients } from "./clients";
import { listPackages } from "./packages";

export const bookingsQuery = queryOptions({ queryKey: ["bookings"], queryFn: listBookings });
export const bookingQuery = (id: string) => queryOptions({ queryKey: ["bookings", id], queryFn: () => getBooking(id) });
export const clientsQuery = queryOptions({ queryKey: ["clients"], queryFn: listClients });
export const packagesQuery = queryOptions({ queryKey: ["packages"], queryFn: listPackages });
