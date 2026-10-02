import type { Booking, Client, Contract, Diagnostic, Invoice, Package } from "@/lib/data/types";
import { emptyDiagnosticContent } from "@/lib/data/types";
import { MOCK_OWNER_ID } from "../session";
import type { Snapshot } from "./memory";

/**
 * Dados de exemplo do schema. Servem de referência do formato esperado em cada
 * tabela e são carregados na primeira execução do servidor.
 * TODO(supabase): substitua por um `supabase db seed` usando o mesmo conteúdo.
 */

const ts = "2026-09-01T12:00:00.000Z";
const owner_id = MOCK_OWNER_ID;

export const seedPackages: Package[] = [
  {
    id: "pkg-bronze",
    owner_id,
    name: "Bronze",
    description: "1h de ensaio, 20 fotos editadas",
    price_cents: 45000,
    duration_minutes: 60,
    active: true,
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "pkg-prata",
    owner_id,
    name: "Prata",
    description: "2h de ensaio, 40 fotos editadas",
    price_cents: 80000,
    duration_minutes: 120,
    active: true,
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "pkg-ouro",
    owner_id,
    name: "Ouro",
    description: "3h, 2 locações, 70 fotos + álbum",
    price_cents: 120000,
    duration_minutes: 180,
    active: true,
    created_at: ts,
    updated_at: ts,
  },
];

export const seedClients: Client[] = [
  {
    id: "cli-maria",
    owner_id,
    name: "Maria Oliveira",
    phone: "(11) 98765-4321",
    email: "maria@email.com",
    cpf: null,
    notes: null,
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "cli-ana",
    owner_id,
    name: "Ana Souza",
    phone: "(11) 91234-5678",
    email: "ana.souza@email.com",
    cpf: "123.456.789-09",
    notes: "Prefere luz natural",
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "cli-julia",
    owner_id,
    name: "Júlia Lima",
    phone: "(21) 99876-1122",
    email: null,
    cpf: null,
    notes: null,
    created_at: ts,
    updated_at: ts,
  },
];

type BookingSeed = Partial<Booking> &
  Pick<
    Booking,
    "id" | "client_id" | "package_id" | "date" | "time" | "location" | "status" | "total_cents"
  >;

const booking = (seed: BookingSeed): Booking => ({
  owner_id,
  deposit_cents: 0,
  payment_method: "pix",
  payment_status: "pending",
  source: "form",
  raw_text: null,
  calendar_sync_status: "nao_sincronizado",
  created_at: ts,
  updated_at: ts,
  ...seed,
});

export const seedBookings: Booking[] = [
  booking({
    id: "bk-1",
    client_id: "cli-maria",
    package_id: "pkg-ouro",
    date: "2026-10-10",
    time: "15:00",
    location: "Parque Ibirapuera",
    status: "confirmed",
    total_cents: 120000,
    deposit_cents: 60000,
    payment_status: "partial",
    calendar_sync_status: "sincronizado",
  }),
  booking({
    id: "bk-2",
    client_id: "cli-ana",
    package_id: "pkg-prata",
    date: "2026-10-14",
    time: "09:30",
    location: "Estúdio Vila Madalena",
    status: "scheduled",
    total_cents: 80000,
    payment_method: "card",
  }),
  booking({
    id: "bk-3",
    client_id: "cli-julia",
    package_id: "pkg-bronze",
    date: "2026-10-20",
    time: "17:00",
    location: "Praia de Ipanema",
    status: "pending",
    total_cents: 45000,
    payment_method: "installments",
  }),
  booking({
    id: "bk-4",
    client_id: "cli-maria",
    package_id: "pkg-bronze",
    date: "2026-09-12",
    time: "10:00",
    location: "Jardim Botânico",
    status: "completed",
    total_cents: 45000,
    deposit_cents: 45000,
    payment_status: "paid",
    payment_method: "cash",
  }),
  booking({
    id: "bk-5",
    client_id: "cli-ana",
    package_id: "pkg-ouro",
    date: "2026-09-25",
    time: "16:00",
    location: "Centro Histórico",
    status: "cancelled",
    total_cents: 120000,
  }),
];

/** Uma linha por ensaio, espelhando o comportamento de `createBooking`. */
const integration = (bookingId: string) => ({
  owner_id,
  booking_id: bookingId,
  created_at: ts,
  updated_at: ts,
});

export const seedDiagnostics: Diagnostic[] = [
  {
    id: "diag-1",
    ...integration("bk-1"),
    conteudo: {
      referencias: "Editorial de praia, tons terrosos",
      looks: "",
      producao: "",
      pendencias: "",
    },
  },
  {
    id: "diag-2",
    ...integration("bk-2"),
    conteudo: emptyDiagnosticContent(),
  },
  {
    id: "diag-3",
    ...integration("bk-3"),
    conteudo: emptyDiagnosticContent(),
  },
  {
    id: "diag-4",
    ...integration("bk-4"),
    conteudo: emptyDiagnosticContent(),
  },
  {
    id: "diag-5",
    ...integration("bk-5"),
    conteudo: emptyDiagnosticContent(),
  },
];

export const seedContracts: Contract[] = [
  { id: "ctr-1", ...integration("bk-1"), status: "gerado" },
  { id: "ctr-2", ...integration("bk-2"), status: "nao_gerado" },
  { id: "ctr-3", ...integration("bk-3"), status: "nao_gerado" },
  { id: "ctr-4", ...integration("bk-4"), status: "assinado" },
  { id: "ctr-5", ...integration("bk-5"), status: "nao_gerado" },
];

export const seedInvoices: Invoice[] = [
  { id: "inv-1", ...integration("bk-1"), status: "pendente", numero: null, issued_on: null },
  { id: "inv-2", ...integration("bk-2"), status: "pendente", numero: null, issued_on: null },
  { id: "inv-3", ...integration("bk-3"), status: "pendente", numero: null, issued_on: null },
  {
    id: "inv-4",
    ...integration("bk-4"),
    status: "emitida",
    numero: "NF-0004",
    issued_on: "2026-09-12",
  },
  { id: "inv-5", ...integration("bk-5"), status: "pendente", numero: null, issued_on: null },
];

export const seedSnapshot = (): Snapshot => ({
  clients: structuredClone(seedClients),
  packages: structuredClone(seedPackages),
  bookings: structuredClone(seedBookings),
  diagnostics: structuredClone(seedDiagnostics),
  contracts: structuredClone(seedContracts),
  invoices: structuredClone(seedInvoices),
});
