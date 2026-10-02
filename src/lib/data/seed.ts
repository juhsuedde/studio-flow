import type { Booking, Client, Package } from "./types";

const ts = "2026-09-01T12:00:00.000Z";

export const seedPackages: Package[] = [
  { id: "pkg-bronze", name: "Bronze", description: "1h de ensaio, 20 fotos editadas", price_cents: 45000, duration_minutes: 60, active: true, created_at: ts, updated_at: ts },
  { id: "pkg-prata", name: "Prata", description: "2h de ensaio, 40 fotos editadas", price_cents: 80000, duration_minutes: 120, active: true, created_at: ts, updated_at: ts },
  { id: "pkg-ouro", name: "Ouro", description: "3h, 2 locações, 70 fotos + álbum", price_cents: 120000, duration_minutes: 180, active: true, created_at: ts, updated_at: ts },
];

export const seedClients: Client[] = [
  { id: "cli-maria", name: "Maria Oliveira", phone: "(11) 98765-4321", email: "maria@email.com", cpf: null, notes: null, created_at: ts, updated_at: ts },
  { id: "cli-ana", name: "Ana Souza", phone: "(11) 91234-5678", email: "ana.souza@email.com", cpf: "123.456.789-09", notes: "Prefere luz natural", created_at: ts, updated_at: ts },
  { id: "cli-julia", name: "Júlia Lima", phone: "(21) 99876-1122", email: null, cpf: null, notes: null, created_at: ts, updated_at: ts },
];

const b = (p: Partial<Booking> & Pick<Booking, "id" | "client_id" | "package_id" | "date" | "time" | "location" | "status" | "total_cents">): Booking => ({
  deposit_cents: 0,
  payment_method: "pix",
  payment_status: "pending",
  source: "form",
  raw_text: null,
  calendar_sync_status: "not_started",
  contract_status: "not_started",
  invoice_status: "not_started",
  created_at: ts,
  updated_at: ts,
  ...p,
});

export const seedBookings: Booking[] = [
  b({ id: "bk-1", client_id: "cli-maria", package_id: "pkg-ouro", date: "2026-10-10", time: "15:00", location: "Parque Ibirapuera", status: "confirmed", total_cents: 120000, deposit_cents: 60000, payment_status: "partial" }),
  b({ id: "bk-2", client_id: "cli-ana", package_id: "pkg-prata", date: "2026-10-14", time: "09:30", location: "Estúdio Vila Madalena", status: "scheduled", total_cents: 80000, payment_method: "card" }),
  b({ id: "bk-3", client_id: "cli-julia", package_id: "pkg-bronze", date: "2026-10-20", time: "17:00", location: "Praia de Ipanema", status: "pending", total_cents: 45000, payment_method: "installments" }),
  b({ id: "bk-4", client_id: "cli-maria", package_id: "pkg-bronze", date: "2026-09-12", time: "10:00", location: "Jardim Botânico", status: "completed", total_cents: 45000, deposit_cents: 45000, payment_status: "paid", payment_method: "cash" }),
  b({ id: "bk-5", client_id: "cli-ana", package_id: "pkg-ouro", date: "2026-09-25", time: "16:00", location: "Centro Histórico", status: "cancelled", total_cents: 120000 }),
];
