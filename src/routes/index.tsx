import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, CircleDollarSign, Clock3, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/AppShell";
import { EmptyState, StatusBadge } from "@/components/app/states";
import { bookingsQuery, clientsQuery } from "@/lib/data/queries";
import { formatBRL, formatDate } from "@/lib/format";

export const Route = createFileRoute("/")({
  ssr: false,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(bookingsQuery),
      context.queryClient.ensureQueryData(clientsQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Visão geral — Estúdio" },
      { name: "description", content: "Painel de ensaios, clientes e recebimentos do estúdio." },
      { property: "og:title", content: "Visão geral — Estúdio" },
      {
        property: "og:description",
        content: "Painel de ensaios, clientes e recebimentos do estúdio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
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
      <PageHeader
        title="Visão geral"
        description="Sua agenda, seus clientes e o que está por vir."
        actions={
          <Button asChild>
            <Link to="/ensaios/novo">
              <Plus /> Novo ensaio
            </Link>
          </Button>
        }
      />
      <section aria-label="Resumo do estúdio" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CalendarDays} label="Próximos ensaios" value={String(active.length)} tone="bg-studio-mint" index="01" />
        <Metric icon={CircleDollarSign} label="A receber" value={formatBRL(receivable)} tone="bg-studio-yellow" index="02" />
        <Metric icon={Users} label="Clientes" value={String(clients.length)} tone="bg-studio-blue" index="03" />
        <Metric
          icon={Clock3}
          label="Pendentes"
          value={String(bookings.filter((b) => b.status === "pending").length)}
          tone="bg-studio-pink"
          index="04"
        />
      </section>
      <section className="mt-10 sm:mt-12">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h2 className="min-w-0 text-lg font-bold">Próximos ensaios</h2>
          <Button variant="ghost" size="sm" asChild>
             <Link to="/ensaios">Ver todos <ArrowUpRight /></Link>
          </Button>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            title="Nenhum ensaio agendado"
            action={
              <Button asChild>
                <Link to="/ensaios/novo">Cadastrar ensaio</Link>
              </Button>
            }
          />
        ) : (
          <div className="border-t">
            {upcoming.map((b) => (
              <Link
                key={b.id}
                to="/ensaios/$id"
                params={{ id: b.id }}
                className="group grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b py-5 transition-colors hover:bg-secondary/50 sm:grid-cols-[3.75rem_minmax(0,1fr)_auto] xl:grid-cols-[3.75rem_minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <div className="row-span-2 grid h-16 place-content-center rounded-lg bg-secondary text-center sm:row-span-1">
                  <div className="text-xl font-bold tabular">
                    {formatDate(b.date, { day: "2-digit" })}
                  </div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    {formatDate(b.date, { month: "short" })}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold sm:text-base">
                    {b.client?.name ?? "Cliente removida"}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {b.package?.name} · {b.time}
                  </div>
                </div>
                <div className="hidden min-w-0 truncate text-sm text-muted-foreground xl:block">
                  {b.location}
                </div>
                <div className="col-start-2 flex items-center gap-4 sm:col-start-auto"><StatusBadge status={b.status} /><ArrowUpRight className="hidden h-4 w-4 text-muted-foreground sm:block" /></div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
  index,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  tone: string;
  index: string;
}) {
  return (
    <div className={`min-w-0 rounded-lg p-5 text-foreground ${tone}`}>
      <div className="mb-7 flex items-center justify-between">
        <span className="font-mono text-[10px] text-foreground/60">{index}</span>
        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
      </div>
      <p className="whitespace-nowrap text-2xl font-semibold tabular">{value}</p>
      <p className="mt-2 text-xs font-medium text-foreground/75">{label}</p>
    </div>
  );
}
