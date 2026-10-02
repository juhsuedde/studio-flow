import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CircleDollarSign, Clock3, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/AppShell";
import { EmptyState, StatusBadge } from "@/components/app/states";
import { bookingsQuery, clientsQuery } from "@/lib/data/queries";
import { formatBRL, formatDate } from "@/lib/format";

export const Route = createFileRoute("/")({
  ssr: false,
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(bookingsQuery), context.queryClient.ensureQueryData(clientsQuery)]),
  head: () => ({ meta: [
    { title: "Visão geral — Estúdio" }, { name: "description", content: "Painel de ensaios, clientes e recebimentos do estúdio." },
    { property: "og:title", content: "Visão geral — Estúdio" }, { property: "og:description", content: "Painel de ensaios, clientes e recebimentos do estúdio." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Index,
});

function Index() {
  const { data: bookings } = useSuspenseQuery(bookingsQuery);
  const { data: clients } = useSuspenseQuery(clientsQuery);
  const active = bookings.filter((b) => b.status !== "cancelled" && b.status !== "completed");
  const receivable = active.reduce((n, b) => n + Math.max(0, b.total_cents - b.deposit_cents), 0);
  const upcoming = active.slice(0, 4);
  return (
    <div>
      <PageHeader title="Visão geral" description="Acompanhe a agenda e os recebimentos." actions={<Button asChild><Link to="/ensaios/novo"><Plus /> Novo ensaio</Link></Button>} />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={CalendarDays} label="Próximos ensaios" value={String(active.length)} />
        <Metric icon={CircleDollarSign} label="A receber" value={formatBRL(receivable)} />
        <Metric icon={Users} label="Clientes" value={String(clients.length)} />
        <Metric icon={Clock3} label="Pendentes" value={String(bookings.filter((b) => b.status === "pending").length)} />
      </section>
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Próximos ensaios</h2><Button variant="ghost" size="sm" asChild><Link to="/ensaios">Ver todos</Link></Button></div>
        {upcoming.length === 0 ? <EmptyState title="Nenhum ensaio agendado" action={<Button asChild><Link to="/ensaios/novo">Cadastrar ensaio</Link></Button>} /> : (
          <div className="overflow-hidden rounded-lg border bg-card">
            {upcoming.map((b) => <Link key={b.id} to="/ensaios/$id" params={{ id: b.id }} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-b p-3 last:border-b-0 hover:bg-muted/50 md:grid-cols-[5rem_1fr_1fr_auto]">
              <div className="text-center"><div className="text-lg font-semibold tabular">{formatDate(b.date, { day: "2-digit" })}</div><div className="text-[11px] uppercase text-muted-foreground">{formatDate(b.date, { month: "short" })}</div></div>
              <div className="min-w-0"><div className="truncate text-sm font-medium">{b.client?.name ?? "Cliente removida"}</div><div className="truncate text-xs text-muted-foreground">{b.package?.name} · {b.time}</div></div>
              <div className="hidden truncate text-sm text-muted-foreground md:block">{b.location}</div><StatusBadge status={b.status} />
            </Link>)}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><Icon className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-mono text-lg font-medium tabular">{value}</p></div></CardContent></Card>;
}
