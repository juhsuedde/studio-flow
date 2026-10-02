import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { EmptyState, StatusBadge } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteBooking } from "@/lib/data/bookings";
import { bookingsQuery } from "@/lib/data/queries";
import type { BookingWithRelations } from "@/lib/data/types";
import { formatBRL, formatDate } from "@/lib/format";

export const Route = createFileRoute("/ensaios/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(bookingsQuery),
  head: () => ({ meta: [
    { title: "Ensaios — Estúdio" }, { name: "description", content: "Agenda e gestão de todos os ensaios." },
    { property: "og:title", content: "Ensaios — Estúdio" }, { property: "og:description", content: "Agenda e gestão de todos os ensaios." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: BookingsPage,
});

function BookingsPage() {
  const { data } = useSuspenseQuery(bookingsQuery);
  const qc = useQueryClient();
  const [target, setTarget] = useState<BookingWithRelations | null>(null);
  const del = useMutation({ mutationFn: deleteBooking, onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookings"] }); toast.success("Ensaio excluído"); setTarget(null); }, onError: (e) => toast.error(e.message) });
  return <div>
    <PageHeader title="Ensaios" description={`${data.length} registros`} actions={<Button asChild><Link to="/ensaios/novo"><Plus /> Novo ensaio</Link></Button>} />
    {data.length === 0 ? <EmptyState title="Nenhum ensaio cadastrado" description="Comece adicionando o primeiro ensaio." action={<Button asChild><Link to="/ensaios/novo">Novo ensaio</Link></Button>} /> : (
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead className="hidden md:table-cell">Pacote / Local</TableHead><TableHead>Status</TableHead><TableHead className="hidden text-right sm:table-cell">Valor</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
          <TableBody>{data.map((b) => <TableRow key={b.id}>
            <TableCell className="whitespace-nowrap"><Link to="/ensaios/$id" params={{ id: b.id }} className="font-medium hover:text-primary">{formatDate(b.date, { day: "2-digit", month: "short" })}<span className="block text-xs font-normal text-muted-foreground">{b.time}</span></Link></TableCell>
            <TableCell><Link to="/ensaios/$id" params={{ id: b.id }} className="font-medium hover:text-primary">{b.client?.name ?? "—"}</Link></TableCell>
            <TableCell className="hidden md:table-cell"><span className="block">{b.package?.name}</span><span className="block max-w-56 truncate text-xs text-muted-foreground">{b.location}</span></TableCell>
            <TableCell><StatusBadge status={b.status} /></TableCell><TableCell className="hidden text-right font-mono tabular sm:table-cell">{formatBRL(b.total_cents)}</TableCell>
            <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link to="/ensaios/$id/editar" params={{ id: b.id }}><Pencil /> Editar</Link></DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => setTarget(b)}><Trash2 /> Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
          </TableRow>)}</TableBody></Table>
      </div>
    )}
    <ConfirmDelete open={!!target} onOpenChange={(o) => !o && setTarget(null)} title="Excluir este ensaio?" description={`O ensaio de ${target?.client?.name ?? "cliente"} será removido definitivamente.`} onConfirm={() => target && del.mutate(target.id)} />
  </div>;
}