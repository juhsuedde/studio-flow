// Tipos espelham exatamente o schema.sql (snake_case = colunas do banco).
// Valores monetários sempre em centavos (integer).

export type BookingStatus = "pending" | "scheduled" | "confirmed" | "completed" | "cancelled";
export type PaymentMethod = "pix" | "card" | "cash" | "installments";
export type PaymentStatus = "pending" | "partial" | "paid";
export type BookingSource = "form" | "ai_text";
/** Status de integrações futuras (Google Calendar, contrato, nota fiscal). */
export type IntegrationStatus = "not_started" | "pending" | "done" | "error";

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  package_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  status: BookingStatus;
  total_cents: number;
  deposit_cents: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  source: BookingSource;
  raw_text: string | null;
  calendar_sync_status: IntegrationStatus;
  contract_status: IntegrationStatus;
  invoice_status: IntegrationStatus;
  created_at: string;
  updated_at: string;
}

export interface BookingWithRelations extends Booking {
  client: Client | null;
  package: Package | null;
}

export type ClientInput = Pick<Client, "name" | "phone" | "email" | "cpf" | "notes">;
export type PackageInput = Pick<Package, "name" | "description" | "price_cents" | "duration_minutes" | "active">;
export type BookingInput = Omit<Booking, "id" | "created_at" | "updated_at">;

/** Rascunho compartilhado pelos dois modos de cadastro (formulário e texto livre). */
export interface BookingDraft {
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientCpf: string;
  packageId: string;
  date: string;
  time: string;
  location: string;
  totalCents: number;
  paymentMethod: PaymentMethod | "";
  depositCents: number;
  source: BookingSource;
  rawText: string;
}

export const emptyDraft = (): BookingDraft => ({
  clientId: null,
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  clientCpf: "",
  packageId: "",
  date: "",
  time: "",
  location: "",
  totalCents: 0,
  paymentMethod: "",
  depositCents: 0,
  source: "form",
  rawText: "",
});
