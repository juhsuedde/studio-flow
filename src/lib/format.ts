import type { BookingStatus, PaymentMethod, PaymentStatus } from "./data/types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (cents: number) => brl.format((cents || 0) / 100);

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
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
