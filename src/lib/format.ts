import type {
  BookingStatus,
  CalendarSyncStatus,
  ContractStatus,
  DiagnosticSection,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from "./data/types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (cents: number) => brl.format((cents || 0) / 100);

export function formatDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
) {
  if (!iso) return "—";
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", opts);
}

export const statusLabel: Record<BookingStatus, string> = {
  pending: "Pendente",
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  pix: "Pix",
  card: "Cartão",
  cash: "Dinheiro",
  installments: "Parcelado",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: "A receber",
  partial: "Entrada paga",
  paid: "Quitado",
};

/** Seções do card "Diagnóstico do ensaio", na ordem em que aparecem na tela. */
export const diagnosticSections: { key: DiagnosticSection; label: string }[] = [
  { key: "referencias", label: "Referências de estilo" },
  { key: "looks", label: "Roupas/looks" },
  { key: "producao", label: "Observações de produção" },
  { key: "pendencias", label: "Pendências" },
];

export const contractStatusLabel: Record<ContractStatus, string> = {
  nao_gerado: "Não gerado",
  gerado: "Gerado",
  enviado: "Enviado para assinatura",
  assinado: "Assinado",
};

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  pendente: "Pendente",
  emitida: "Emitida",
};

export const calendarStatusLabel: Record<CalendarSyncStatus, string> = {
  nao_sincronizado: "Não sincronizado",
  sincronizado: "Sincronizado",
};
