import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, FileSignature, MapPin, Pencil, Receipt, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingQuery } from "@/lib/data/queries";
import { formatBRL, formatDate, paymentMethodLabel, paymentStatusLabel } from "@/lib/format";

export const Route = createFileRoute("/ensaios/$id/")({
  ssr: false,
  loader: async ({ context, params }) => { const b = await context.queryClient.ensureQueryData(bookingQuery(params.id)); if (!b) throw notFound(); return b; },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.client?.name ?? "Ensaio"} — Estúdio` : "Ensaio indisponível — Estúdio" }, { name: "description", content: "Detalhes, pagamento e integrações do ensaio." },
    { property: "og:title", content: "Detalhes do ensaio — Estúdio" }, { property: "og:description", content: "Detalhes, pagamento e integrações do ensaio." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: BookingDetail,
});

function BookingDetail() {
  const { id } = Route.useParams();
  const { data: b } = useSuspenseQuery(bookingQuery(id));
  if (!b) return null;
  return <div><PageHeader title={b.client?.name ?? "Ensaio"} description={`${formatDate(b.date)} às ${b.time}`} actions={<Button variant="outline" asChild><Link to="/ensaios/$id/editar" params={{ id }}><Pencil /> Editar</Link></Button>} />
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Dados do ensaio</CardTitle><StatusBadge status={b.status} /></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <Info label="Cliente" value={b.client?.name ?? "—"} sub={b.client?.phone ?? b.client?.email ?? undefined} /><Info label="Pacote" value={b.package?.name ?? "—"} sub={b.package?.description ?? undefined} />
        <Info label="Data e horário" value={`${formatDate(b.date, { weekday: "long", day: "2-digit", month: "long" })}, ${b.time}`} /><Info label="Local" value={b.location} />
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Financeiro</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Line l="Total" v={formatBRL(b.total_cents)} /><Line l="Entrada" v={formatBRL(b.deposit_cents)} /><Line l="Restante" v={formatBRL(Math.max(0, b.total_cents - b.deposit_cents))} strong /><Line l="Pagamento" v={paymentMethodLabel[b.payment_method]} /><Line l="Situação" v={paymentStatusLabel[b.payment_status]} /></CardContent></Card>
    </div>
    <h2 className="mb-3 mt-7 font-semibold">Integrações futuras</h2><div className="grid gap-3 md:grid-cols-3"><Integration icon={Calendar} title="Google Calendar" /><Integration icon={FileSignature} title="Contrato ClickSign" /><Integration icon={Receipt} title="Nota fiscal" /></div>
  </div>;
}
function Info({ label, value, sub }: { label: string; value: string; sub?: string | undefined }) { return <div><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value}</div>{sub && <div className="mt-0.5 text-sm text-muted-foreground">{sub}</div>}</div>; }
function Line({ l, v, strong }: { l: string; v: string; strong?: boolean }) { return <div className="flex justify-between gap-3 border-b pb-2 last:border-0"><span className="text-muted-foreground">{l}</span><span className={strong ? "font-mono font-semibold tabular" : "font-medium"}>{v}</span></div>; }
function Integration({ icon: Icon, title }: { icon: typeof MapPin; title: string }) { return <Card><CardContent className="flex items-center gap-3 p-4"><div className="grid h-9 w-9 place-items-center rounded-md bg-muted"><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="text-sm font-medium">{title}</div><div className="text-xs text-muted-foreground">Não conectado</div></div><Button variant="ghost" size="icon" disabled title="Integração futura"><RefreshCw /></Button></CardContent></Card>; }