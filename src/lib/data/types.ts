// Tipos espelham exatamente o schema.sql (snake_case = colunas do banco).
// Valores monetários sempre em centavos (integer).

export type BookingStatus = "pending" | "scheduled" | "confirmed" | "completed" | "cancelled";
export type PaymentMethod = "pix" | "card" | "cash" | "installments";
export type PaymentStatus = "pending" | "partial" | "paid";
export type BookingSource = "form" | "ai_text";

/** Coluna futura de integração com o Google Calendar em `bookings`. */
export type CalendarSyncStatus = "nao_sincronizado" | "sincronizado";
export type ContractStatus = "nao_gerado" | "gerado" | "enviado" | "assinado";
export type InvoiceStatus = "pendente" | "emitida";

/** Seções fixas do card "Diagnóstico do ensaio" (jsonb `conteudo` de `diagnostics`). */
export type DiagnosticSection = "referencias" | "looks" | "producao" | "pendencias";
export type DiagnosticContent = Record<DiagnosticSection, string>;

export const emptyDiagnosticContent = (): DiagnosticContent => ({
  referencias: "",
  looks: "",
  producao: "",
  pendencias: "",
});

export interface Client {
  id: string;
  owner_id: string;
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
  owner_id: string;
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
  owner_id: string;
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
  calendar_sync_status: CalendarSyncStatus;
  created_at: string;
  updated_at: string;
}

export interface BookingWithRelations extends Booking {
  client: Client | null;
  package: Package | null;
  /** Linha 1:1 criada junto com o ensaio (jsonb `conteudo` com as seções). */
  diagnostic: Diagnostic | null;
  /** Linha 1:1 criada junto com o ensaio (status do contrato). */
  contract: Contract | null;
  /** Linha 1:1 criada junto com o ensaio (status da nota fiscal). */
  invoice: Invoice | null;
}

export interface Diagnostic {
  id: string;
  owner_id: string;
  booking_id: string;
  conteudo: DiagnosticContent;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  owner_id: string;
  booking_id: string;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  owner_id: string;
  booking_id: string;
  status: InvoiceStatus;
  numero: string | null;
  issued_on: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientInput = Pick<Client, "name" | "phone" | "email" | "cpf" | "notes">;
export type PackageInput = Pick<
  Package,
  "name" | "description" | "price_cents" | "duration_minutes" | "active"
>;
export type BookingInput = Omit<Booking, "id" | "owner_id" | "created_at" | "updated_at">;

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
