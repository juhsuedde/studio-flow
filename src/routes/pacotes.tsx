import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { PackageDialog } from "@/components/app/PackageDialog";
import { EmptyState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deletePackage } from "@/lib/data/packages";
import { packagesQuery } from "@/lib/data/queries";
import type { Package } from "@/lib/data/types";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/pacotes")({
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(packagesQuery),
  head: () => ({ meta: [
    { title: "Pacotes — Estúdio" }, { name: "description", content: "Valores, duração e descrição dos pacotes de ensaio." },
    { property: "og:title", content: "Pacotes — Estúdio" }, { property: "og:description", content: "Valores, duração e descrição dos pacotes de ensaio." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: PackagesPage,
});
function PackagesPage() { const { data } = useSuspenseQuery(packagesQuery); const qc = useQueryClient(); const [editing, setEditing] = useState<Package | "new" | null>(null); const [target, setTarget] = useState<Package | null>(null); const del = useMutation({ mutationFn: deletePackage, onSuccess: () => { qc.invalidateQueries({ queryKey: ["packages"] }); toast.success("Pacote excluído"); setTarget(null); }, onError: e => toast.error(e.message) }); return <div><PageHeader title="Pacotes" description="Gerencie as opções disponíveis no cadastro." actions={<Button onClick={() => setEditing("new")}><Plus /> Novo pacote</Button>} />{data.length === 0 ? <EmptyState title="Nenhum pacote cadastrado" action={<Button onClick={() => setEditing("new")}>Criar pacote</Button>} /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.map(p => <Card key={p.id} className={!p.active ? "opacity-60" : ""}><CardContent className="p-5"><div className="flex items-start justify-between gap-2"><div><h2 className="font-semibold">{p.name}</h2><div className="mt-1 font-mono text-lg text-primary tabular">{formatBRL(p.price_cents)}</div></div><span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{p.active ? "Ativo" : "Inativo"}</span></div><p className="mt-3 min-h-10 text-sm text-muted-foreground">{p.description ?? "Sem descrição"}</p><div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {p.duration_minutes} minutos</div><div className="mt-4 flex gap-2 border-t pt-3"><Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(p)}><Pencil /> Editar</Button><Button variant="ghost" size="icon" className="text-destructive" aria-label="Excluir" onClick={() => setTarget(p)}><Trash2 /></Button></div></CardContent></Card>)}</div>}<PackageDialog open={!!editing} pkg={editing === "new" ? null : editing} onOpenChange={o => !o && setEditing(null)} /><ConfirmDelete open={!!target} onOpenChange={o => !o && setTarget(null)} title={`Excluir pacote "${target?.name ?? ""}"?`} description="A exclusão é bloqueada se o pacote estiver em uso." onConfirm={() => target && del.mutate(target.id)} /></div>; }