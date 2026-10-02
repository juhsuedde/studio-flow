import type { BookingDraft, Package, PaymentMethod } from "@/lib/data/types";

/**
 * Extração de texto livre → campos do formulário.
 *
 * Hoje é heurística local, sem IA de verdade: cumpre o contrato da API e
 * devolve sempre dados plausíveis para a usuária revisar.
 *
 * TODO(edge-function): substituir o corpo de `extractBookingFromText` por uma
 * chamada à Edge Function `extract-booking`, que roda o modelo e devolve o
 * mesmo `BookingDraft`. Nem a rota nem a UI mudam: só esta implementação.
 */

export interface ExtractResult {
  draft: BookingDraft;
  /** `heuristic` agora; vira `ai` quando a Edge Function entrar. */
  engine: "heuristic";
  /** Aviso exibido pela UI enquanto a extração automática não é real. */
  notice: string;
}

const EXTRACT_NOTICE = "Extração automática em breve — revise os campos";

export function extractBookingFromText(
  text: string,
  packages: Package[],
  base: BookingDraft,
): ExtractResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const draft: BookingDraft = { ...base, source: "ai_text", rawText: trimmed };

  const name = trimmed.match(
    /\b(?:d[aoe]|cliente:?)\s+([A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)?)/,
  );
  if (name?.[1]) draft.clientName = name[1];

  const pkg = packages.find((candidate) => lower.includes(candidate.name.toLowerCase()));
  if (pkg) draft.packageId = pkg.id;

  const date = trimmed.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (date?.[1] && date[2]) {
    const year = date[3]
      ? date[3].length === 2
        ? `20${date[3]}`
        : date[3]
      : String(new Date().getFullYear());
    draft.date = `${year}-${date[2].padStart(2, "0")}-${date[1].padStart(2, "0")}`;
  }

  const time = trimmed.match(/(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);
  if (time?.[1]) draft.time = `${time[1].padStart(2, "0")}:${time[2] ?? "00"}`;

  const location = trimmed
    .split(",")
    .map((part) => part.trim())
    .find((part) =>
      /^(parque|praia|estúdio|estudio|praça|praca|jardim|rua|av\.?|avenida|centro)\b/i.test(part),
    );
  if (location) draft.location = location;

  const money = trimmed.match(/R\$\s*([\d.]+(?:,\d{2})?)/i);
  if (money?.[1]) draft.totalCents = toCents(money[1]);
  else if (pkg) draft.totalCents = pkg.price_cents;

  const method = PAYMENT_METHODS.find(([pattern]) => pattern.test(lower));
  if (method?.[1]) draft.paymentMethod = method[1];

  if (/metade|50\s*%/.test(lower)) draft.depositCents = Math.round(draft.totalCents / 2);

  const phone = trimmed.match(/\(?\d{2}\)?\s?9?\d{4}-?\d{4}/);
  if (phone) draft.clientPhone = phone[0];

  const email = trimmed.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (email) draft.clientEmail = email[0];

  return { draft, engine: "heuristic", notice: EXTRACT_NOTICE };
}

const PAYMENT_METHODS: [RegExp, PaymentMethod][] = [
  [/parcel/, "installments"],
  [/pix/, "pix"],
  [/cart[aã]o|cr[eé]dito/, "card"],
  [/dinheiro|esp[eé]cie/, "cash"],
];

function toCents(value: string): number {
  return Math.round(Number.parseFloat(value.replace(/\./g, "").replace(",", ".")) * 100);
}
