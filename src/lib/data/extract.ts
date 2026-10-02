// MOCK de extração de texto livre -> campos do formulário.
// TODO(edge-function): substituir por chamada a uma Edge Function "extract-booking"
// que usará IA para estruturar o texto. Hoje é apenas heurística local, sem IA.
import type { BookingDraft, Package, PaymentMethod } from "./types";

export function mockExtract(text: string, packages: Package[], base: BookingDraft): BookingDraft {
  const t = text.trim();
  const lower = t.toLowerCase();
  const d: BookingDraft = { ...base, source: "ai_text", rawText: t };

  const name = t.match(/\b(?:d[aoe]|cliente:?)\s+([A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)?)/);
  if (name?.[1]) d.clientName = name[1];

  const pkg = packages.find((p) => lower.includes(p.name.toLowerCase()));
  if (pkg) d.packageId = pkg.id;

  const date = t.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (date?.[1] && date[2]) {
    const y = date[3] ? (date[3].length === 2 ? "20" + date[3] : date[3]) : String(new Date().getFullYear());
    d.date = `${y}-${date[2].padStart(2, "0")}-${date[1].padStart(2, "0")}`;
  }

  const time = t.match(/(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);
  if (time?.[1]) d.time = `${time[1].padStart(2, "0")}:${time[2] ?? "00"}`;

  const parts = t.split(",").map((s) => s.trim());
  const loc = parts.find((p) => /^(parque|praia|estúdio|estudio|praça|praca|jardim|rua|av\.?|avenida|centro)\b/i.test(p));
  if (loc) d.location = loc;

  const money = t.match(/R\$\s*([\d.]+(?:,\d{2})?)/i);
  if (money?.[1]) d.totalCents = Math.round(parseFloat(money[1].replace(/\./g, "").replace(",", ".")) * 100);
  else if (pkg) d.totalCents = pkg.price_cents;

  const methods: [RegExp, PaymentMethod][] = [
    [/parcel/, "installments"],
    [/pix/, "pix"],
    [/cart[aã]o|cr[eé]dito/, "card"],
    [/dinheiro|esp[eé]cie/, "cash"],
  ];
  const m = methods.find(([re]) => re.test(lower));
  if (m?.[1]) d.paymentMethod = m[1];

  if (/metade|50\s*%/.test(lower)) d.depositCents = Math.round(d.totalCents / 2);

  const phone = t.match(/\(?\d{2}\)?\s?9?\d{4}-?\d{4}/);
  if (phone) d.clientPhone = phone[0];
  const email = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (email) d.clientEmail = email[0];

  return d;
}
