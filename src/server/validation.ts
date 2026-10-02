import { z } from "zod";

/**
 * Validação de entrada da API.
 *
 * Cada regra aqui espelha uma restrição do `schema.sql` — os CHECKs de
 * `schema.sql` continuam valendo no banco, e estas validam antes de gastar uma
 * escrita. `client_id`/`package_id` não são FKs aqui: a existência é checada no
 * repositório, que é quem conhece o adapter.
 */

// ---------- clients ----------
/** A UI manda CPF formatado ("123.456.789-09"); gravamos só os dígitos. */
const cpfSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((digits) => digits === "" || digits.length === 11, "CPF deve ter 11 dígitos");

export const clientCreateSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120, "Nome muito longo"),
  phone: z.string().trim().max(40, "Telefone muito longo").nullish().transform(emptyToNull),
  email: z.string().trim().email("E-mail inválido").max(180).nullish().transform(emptyToNull),
  cpf: cpfSchema.nullish().transform(emptyToNull),
  notes: z.string().trim().max(2000, "Observação muito longa").nullish().transform(emptyToNull),
});

export const clientUpdateSchema = clientCreateSchema.partial();

export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;

// ---------- packages ----------
export const packageCreateSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120, "Nome muito longo"),
  description: z
    .string()
    .trim()
    .max(1000, "Descrição muito longa")
    .nullish()
    .transform(emptyToNull),
  price_cents: cents("Informe o preço"),
  duration_minutes: z
    .number()
    .int("Duração deve ser inteira")
    .positive("Duração deve ser maior que zero")
    .max(1440, "Duração máxima de 24h"),
  active: z.boolean().default(true),
});

export const packageUpdateSchema = packageCreateSchema.partial();

export type PackageCreateInput = z.infer<typeof packageCreateSchema>;
export type PackageUpdateInput = z.infer<typeof packageUpdateSchema>;

// ---------- bookings ----------
export const bookingStatusSchema = z.enum([
  "pending",
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
]);
export const paymentMethodSchema = z.enum(["pix", "card", "cash", "installments"]);
export const paymentStatusSchema = z.enum(["pending", "partial", "paid"]);
export const bookingSourceSchema = z.enum(["form", "ai_text"]);
export const calendarSyncStatusSchema = z.enum(["nao_sincronizado", "sincronizado"]);
export const contractStatusSchema = z.enum(["nao_gerado", "gerado", "enviado", "assinado"]);
export const invoiceStatusSchema = z.enum(["pendente", "emitida"]);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
  .refine(isRealDate, "Data inexistente");

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (use HH:mm)");

export const DEPOSIT_EXCEEDS_TOTAL = "Entrada maior que o total";

const depositWithinTotal = (path: string): { message: string; path: string[] } => ({
  message: DEPOSIT_EXCEEDS_TOTAL,
  path: [path],
});

export const bookingCreateSchema = z
  .object({
    client_id: z.string().min(1, "Selecione a cliente"),
    package_id: z.string().min(1, "Selecione o pacote"),
    date: dateSchema,
    time: timeSchema,
    location: z.string().trim().min(1, "Informe o local").max(240, "Local muito longo"),
    status: bookingStatusSchema.default("scheduled"),
    total_cents: cents("Informe o valor total"),
    deposit_cents: z.number().int().min(0, "Entrada inválida").default(0),
    payment_method: paymentMethodSchema,
    payment_status: paymentStatusSchema.default("pending"),
    source: bookingSourceSchema.default("form"),
    raw_text: z.string().trim().max(8000, "Texto muito longo").nullish().transform(emptyToNull),
    calendar_sync_status: calendarSyncStatusSchema.default("nao_sincronizado"),
  })
  // CHECK (deposit_cents <= total_cents) do schema.sql.
  .refine((v) => v.deposit_cents <= v.total_cents, depositWithinTotal("deposit_cents"));

export const bookingUpdateSchema = z.object({
  client_id: z.string().min(1, "Selecione a cliente").optional(),
  package_id: z.string().min(1, "Selecione o pacote").optional(),
  status: bookingStatusSchema.optional(),
  date: dateSchema.optional(),
  time: timeSchema.optional(),
  location: z.string().trim().min(1, "Informe o local").max(240).optional(),
  total_cents: cents("Informe o valor total").optional(),
  deposit_cents: z.number().int().min(0).optional(),
  payment_method: paymentMethodSchema.optional(),
  payment_status: paymentStatusSchema.optional(),
  source: bookingSourceSchema.optional(),
  raw_text: z.string().trim().max(8000).nullish().transform(emptyToNull).optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;

// ---------- booking draft (compartilhado pelos dois modos de cadastro) ----------
/**
 * Mesmo `BookingDraft` que a UI manipula, em snake_case. É o contrato de
 * `POST /api/bookings/from-draft`, garantindo que o formulário guiado e o texto
 * livre persistam exatamente os mesmos campos.
 */
export const bookingDraftShape = z.object({
  clientId: z.string().min(1).nullish(),
  clientName: z.string().trim().min(1, "Informe o nome da cliente"),
  clientPhone: z.string().trim().max(40).optional().default(""),
  clientEmail: z
    .union([z.string().trim().email("E-mail inválido"), z.literal("")])
    .optional()
    .default(""),
  clientCpf: z.string().trim().max(40).optional().default(""),
  packageId: z.string().min(1, "Selecione o pacote"),
  date: dateSchema,
  time: timeSchema,
  location: z.string().trim().min(1, "Informe o local"),
  totalCents: cents("Informe o valor total"),
  paymentMethod: paymentMethodSchema,
  depositCents: z.number().int().min(0).default(0),
  source: bookingSourceSchema.default("form"),
  rawText: z.string().trim().max(8000).optional().default(""),
});

/** Mesmo CHECK do schema.sql, em nomenclatura de rascunho. */
export const bookingDraftSchema = bookingDraftShape.refine(
  (v) => v.depositCents <= v.totalCents,
  depositWithinTotal("depositCents"),
);

export type BookingDraftInput = z.infer<typeof bookingDraftSchema>;

// ---------- diagnóstico do ensaio ----------
/**
 * `conteudo` é o jsonb de `diagnostics`, com as seções fixas do card
 * "Diagnóstico do ensaio". O máximo por seção é alto porque o texto é livre,
 * só evitando abuso no jsonb.
 */
const diagnosticSectionSchema = z
  .string()
  .trim()
  .max(5000, "Seção muito longa (máx. 5.000 caracteres)")
  .optional()
  .default("");

export const diagnosticContentSchema = z.object({
  referencias: diagnosticSectionSchema,
  looks: diagnosticSectionSchema,
  producao: diagnosticSectionSchema,
  pendencias: diagnosticSectionSchema,
});
export const diagnosticSaveSchema = z.object({
  conteudo: diagnosticContentSchema,
});

export type DiagnosticContentInput = z.infer<typeof diagnosticContentSchema>;

// ---------- extração de texto ----------
/**
 * Rascunho usado como contexto da extração: mesmos campos de `BookingDraft`,
 * porém sem as obrigatoriedades — a usuária pode chamar "Extrair" com o
 * formulário ainda pela metade.
 *
 * Não é payload de gravação: a validação real acontece em `bookingDraftSchema`,
 * no momento de salvar.
 */
const extractDraftContextSchema = z.object({
  clientId: z.string().nullish(),
  clientName: z.string(),
  clientPhone: z.string(),
  clientEmail: z.string(),
  clientCpf: z.string(),
  packageId: z.string(),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  totalCents: z.number(),
  paymentMethod: z.union([paymentMethodSchema, z.literal("")]),
  depositCents: z.number(),
  source: bookingSourceSchema,
  rawText: z.string(),
});

export const extractRequestSchema = z.object({
  text: z.string().trim().min(1, "Cole a mensagem do ensaio").max(8000, "Texto muito longo"),
  draft: extractDraftContextSchema.partial().optional(),
});

// ---------- utilitários ----------
function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Dinheiro sempre em centavos inteiros — nunca float (ver AGENTS.md). */
function cents(message: string) {
  return z
    .number({ invalid_type_error: message })
    .int("Valor deve ser inteiro em centavos")
    .min(0, message)
    .max(100_000_000, "Valor acima do limite suportado");
}

function isRealDate(value: string): boolean {
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
