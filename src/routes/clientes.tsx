import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { EmptyState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createClient, deleteClient, updateClient } from "@/lib/data/clients";
import { clientsQuery } from "@/lib/data/queries";
import type { Client } from "@/lib/data/types";

export const Route = createFileRoute("/clientes")({
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(clientsQuery),
  head: () => ({ meta: [
    { title: "Clientes — Estúdio" }, { name: "description", content: "Cadastro e contatos das clientes do estúdio." },
    { property: "og:title", content: "Clientes — Estúdio" }, { property: "og:description", content: "Cadastro e contatos das clientes do estúdio." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ClientsPage,
});
function ClientsPage() {
  const { data } = useSuspenseQuery(clientsQuery); const qc = useQueryClient();
  const [editing, setEditing] = useState<Client | "new" | null>(null); const [target, setTarget] = useState<Client | null>(null);
  const del = useMutation({ mutationFn: deleteClient, onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Cliente excluída"); setTarget(null); }, onError: (e) => toast.error(e.message) });
  return <div><PageHeader title="Clientes" description={`${data.length} clientes cadastradas`} actions={<Button onClick={() => setEditing("new")}><Plus /> Nova cliente</Button>} />
    {data.length === 0 ? <EmptyState title="Nenhuma cliente cadastrada" action={<Button onClick={() => setEditing("new")}>Cadastrar cliente</Button>} /> : <div className="overflow-hidden rounded-lg border bg-card"><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead className="hidden sm:table-cell">E-mail</TableHead><TableHead className="w-10" /></TableRow></TableHeader><TableBody>{data.map(c => <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.phone ?? "—"}</TableCell><TableCell className="hidden sm:table-cell">{c.email ?? "—"}</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setEditing(c)}><Pencil /> Editar</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => setTarget(c)}><Trash2 /> Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div>}
    <ClientDialog open={!!editing} client={editing === "new" ? null : editing} onOpenChange={(o) => !o && setEditing(null)} />
    <ConfirmDelete open={!!target} onOpenChange={(o) => !o && setTarget(null)} title={`Excluir ${target?.name ?? "cliente"}?`} description="A exclusão é bloqueada quando há ensaios vinculados." onConfirm={() => target && del.mutate(target.id)} />
  </div>;
}
function ClientDialog({ open, client, onOpenChange }: { open: boolean; client: Client | null; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient(); const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [cpf, setCpf] = useState(""); const [notes, setNotes] = useState("");
  useEffect(() => { if (open) { setName(client?.name ?? ""); setPhone(client?.phone ?? ""); setEmail(client?.email ?? ""); setCpf(client?.cpf ?? ""); setNotes(client?.notes ?? ""); } }, [open, client]);
  const m = useMutation({ mutationFn: () => { const input = { name: name.trim(), phone: phone.trim() || null, email: email.trim() || null, cpf: cpf.trim() || null, notes: notes.trim() || null }; return client ? updateClient(client.id, input) : createClient(input); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success(client ? "Cliente atualizada" : "Cliente criada"); onOpenChange(false); }, onError: (e) => toast.error(e.message) });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{client ? "Editar cliente" : "Nova cliente"}</DialogTitle></DialogHeader><form className="space-y-3" onSubmit={e => { e.preventDefault(); if (!name.trim()) { toast.error("Informe o nome"); return; } m.mutate(); }}><F label="Nome*"><Input value={name} onChange={e => setName(e.target.value)} /></F><div className="grid gap-3 sm:grid-cols-2"><F label="Telefone"><Input value={phone} onChange={e => setPhone(e.target.value)} /></F><F label="CPF"><Input value={cpf} onChange={e => setCpf(e.target.value)} /></F></div><F label="E-mail"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></F><F label="Observações"><Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></F><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={m.isPending}>Salvar</Button></DialogFooter></form></DialogContent></Dialog>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }