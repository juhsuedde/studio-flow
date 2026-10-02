import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  CalendarPlus,
  Check,
  CheckCheck,
  Download,
  FileSignature,
  NotebookPen,
  Pencil,
  Plus,
  Receipt,
  Send,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { MoneyInput } from "@/components/app/MoneyInput";
import { StatusBadge } from "@/components/app/states";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { emitInvoice, generateContract, saveDiagnostic, updateBooking } from "@/lib/data/bookings";
import { bookingQuery } from "@/lib/data/queries";
import {
  emptyDiagnosticContent,
  type BookingStatus,
  type BookingWithRelations,
  type DiagnosticContent,
} from "@/lib/data/types";
import {
  calendarStatusLabel,
  contractStatusLabel,
  diagnosticSections,
  formatBRL,
  formatDate,
  invoiceStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ensaios/$id/")({
  ssr: false,
  loader: async ({ context, params }) => {
    const b = await context.queryClient.ensureQueryData(bookingQuery(params.id));
    if (!b) throw notFound();
    return b;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.client?.name ?? "Ensaio"} — Estúdio`
          : "Ensaio indisponível — Estúdio",
      },
      {
        name: "description",
        content: "Ficha do ensaio: resumo, diagnóstico, contrato, nota fiscal e agendamento.",
      },
      { property: "og:title", content: "Ficha do ensaio — Estúdio" },
      {
        property: "og:description",
        content: "Ficha do ensaio: resumo, diagnóstico, contrato, nota fiscal e agendamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookingFicha,
});

function BookingFicha() {
  const { id } = Route.useParams();
  const { data: b } = useSuspenseQuery(bookingQuery(id));
  if (!b) return null;
  return (
    <TooltipProvider delayDuration={200}>
      <div>
        <PageHeader
          title={b.client?.name ?? "Ensaio"}
          description={`Ficha do ensaio · ${formatDate(b.date)} às ${b.time}`}
          actions={
            <Button variant="outline" asChild>
              <Link to="/ensaios/$id/editar" params={{ id }}>
                <Pencil /> Editar
              </Link>
            </Button>
          }
        />
        <Tabs defaultValue="resumo">
          <TabsList className="grid h-auto w-full grid-cols-2 p-1 sm:grid-cols-4">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="contrato">Contrato</TabsTrigger>
            <TabsTrigger value="nota">Nota fiscal</TabsTrigger>
            <TabsTrigger value="agenda">Agendamento</TabsTrigger>
          </TabsList>
          <TabsContent value="resumo" className="mt-5 space-y-5">
            <ResumoView b={b} />
          </TabsContent>
          <TabsContent value="contrato" className="mt-5">
            <ContractView b={b} />
          </TabsContent>
          <TabsContent value="nota" className="mt-5">
            <InvoiceView b={b} />
          </TabsContent>
          <TabsContent value="agenda" className="mt-5">
            <CalendarView b={b} />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

// ---------------- Tab 1 · Resumo ----------------

function ResumoView({ b }: { b: BookingWithRelations }) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const remaining = Math.max(0, b.total_cents - b.deposit_cents);
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Dados do ensaio</CardTitle>
            <StatusBadge status={b.status} />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Info
                label="Cliente"
                value={b.client?.name ?? "—"}
                sub={b.client?.phone ?? b.client?.email ?? undefined}
              />
              <Info
                label="Pacote"
                value={b.package?.name ?? "—"}
                sub={b.package?.description ?? undefined}
              />
              <Info
                label="Data e horário"
                value={`${formatDate(b.date, { weekday: "long", day: "2-digit", month: "long" })}, ${b.time}`}
              />
              <Info label="Local" value={b.location} />
            </div>
            <StatusActions b={b} onCancel={() => setCancelOpen(true)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Line l="Total" v={formatBRL(b.total_cents)} />
            <Line l="Entrada" v={formatBRL(b.deposit_cents)} />
            <Line l="Restante" v={formatBRL(remaining)} strong />
            <Line l="Pagamento" v={paymentMethodLabel[b.payment_method]} />
            <Line l="Situação" v={paymentStatusLabel[b.payment_status]} />
            {b.status !== "cancelled" && (
              <Button variant="outline" className="w-full" onClick={() => setPaymentOpen(true)}>
                <Plus className="h-4 w-4" /> Registrar pagamento
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <DiagnosticCard b={b} />

      <PaymentDialog open={paymentOpen} b={b} onOpenChange={setPaymentOpen} />
      <CancelDialog open={cancelOpen} b={b} onOpenChange={setCancelOpen} />
    </>
  );
}

/** Botões de ação por status: confirmar, marcar como realizado e cancelar. */
function StatusActions({ b, onCancel }: { b: BookingWithRelations; onCancel: () => void }) {
  const qc = useQueryClient();
  const setStatus = useMutation({
    mutationFn: (status: BookingStatus) => updateBooking(b.id, { status }),
    onSuccess: (_, status) => {
      qc.invalidateQueries({ queryKey: ["bookings", b.id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      const done: Partial<Record<BookingStatus, string>> = {
        confirmed: "Ensaio confirmado",
        completed: "Ensaio marcado como realizado",
      };
      if (done[status]) toast.success(done[status]);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <div className="flex flex-wrap gap-2 border-t pt-4">
      {(b.status === "scheduled" || b.status === "pending") && (
        <Button onClick={() => setStatus.mutate("confirmed")} disabled={setStatus.isPending}>
          <Check className="h-4 w-4" /> Confirmar
        </Button>
      )}
      {(b.status === "scheduled" || b.status === "confirmed") && (
        <Button
          variant="outline"
          onClick={() => setStatus.mutate("completed")}
          disabled={setStatus.isPending}
        >
          <CheckCheck className="h-4 w-4" /> Marcar como realizado
        </Button>
      )}
      {b.status !== "cancelled" && b.status !== "completed" && (
        <Button variant="outline" className="text-destructive" onClick={onCancel}>
          <X className="h-4 w-4" /> Cancelar
        </Button>
      )}
    </div>
  );
}

/** Área de texto estruturada, salva no jsonb `conteudo` de `diagnostics`. */
function DiagnosticCard({ b }: { b: BookingWithRelations }) {
  const qc = useQueryClient();
  const initial = b.diagnostic?.conteudo ?? emptyDiagnosticContent();
  const [content, setContent] = useState<DiagnosticContent>(initial);
  const save = useMutation({
    mutationFn: () => saveDiagnostic(b.id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", b.id] });
      toast.success("Diagnóstico salvo");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const dirty = JSON.stringify(content) !== JSON.stringify(initial);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Diagnóstico do ensaio</CardTitle>
        <SoonButton label="Exportar para Notion" icon={NotebookPen} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {diagnosticSections.map(({ key, label }) => (
            <div className="space-y-1.5" key={key}>
              <Label htmlFor={`diag-${key}`}>{label}</Label>
              <Textarea
                id={`diag-${key}`}
                rows={3}
                value={content[key]}
                onChange={(e) => setContent((c) => ({ ...c, [key]: e.target.value }))}
                placeholder={`Registre aqui as observações de ${label.toLowerCase()}…`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
            {save.isPending ? "Salvando…" : "Salvar diagnóstico"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Mini-modal de pagamento: soma o valor recebido à entrada do ensaio. */
function PaymentDialog({
  open,
  onOpenChange,
  b,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  b: BookingWithRelations;
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(0);
  useEffect(() => {
    if (open) setAmount(0);
  }, [open]);
  const remaining = Math.max(0, b.total_cents - b.deposit_cents);
  const invalid = amount <= 0 || amount > remaining;
  const pay = useMutation({
    mutationFn: () => updateBooking(b.id, { deposit_cents: b.deposit_cents + amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", b.id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Pagamento registrado");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            Valor recebido sobre o total de {formatBRL(b.total_cents)}. Restam{" "}
            {formatBRL(remaining)}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="pay-amount">Valor</Label>
          <MoneyInput id="pay-amount" value={amount} onChange={setAmount} invalid={invalid} />
          {invalid && amount > 0 && (
            <p className="text-xs text-destructive">Valor acima do restante</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Voltar</Button>
          </DialogClose>
          <Button onClick={() => pay.mutate()} disabled={invalid || pay.isPending}>
            {pay.isPending ? "Registrando…" : "Registrar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Cancelamento com confirmação — mantém o registro na agenda como "Cancelado". */
function CancelDialog({
  open,
  onOpenChange,
  b,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  b: BookingWithRelations;
}) {
  const qc = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => updateBooking(b.id, { status: "cancelled" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", b.id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Ensaio cancelado");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar este ensaio?</AlertDialogTitle>
          <AlertDialogDescription>
            O ensaio de {b.client?.name ?? "cliente"} permanece na agenda com status "Cancelado" e
            não recebe mais ações de status.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => cancel.mutate()}
          >
            Cancelar ensaio
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------- Tab 2 · Contrato ----------------

function ContractView({ b }: { b: BookingWithRelations }) {
  const qc = useQueryClient();
  const status = b.contract?.status ?? "nao_gerado";
  const gen = useMutation({
    mutationFn: () => generateContract(b.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", b.id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Contrato gerado");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Contrato</CardTitle>
        <Pill>{contractStatusLabel[status]}</Pill>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-md text-sm text-muted-foreground">
          {status === "nao_gerado"
            ? "O contrato formaliza o ensaio. Gere a partir dos dados já cadastrados."
            : "Depois de gerado, o contrato pode ser baixado e enviado para assinatura."}
        </p>
        {status === "nao_gerado" ? (
          <Button onClick={() => gen.mutate()} disabled={gen.isPending}>
            <FileSignature className="h-4 w-4" /> {gen.isPending ? "Gerando…" : "Gerar contrato"}
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <SoonButton label="Baixar PDF" icon={Download} />
            <SoonButton label="Enviar para assinatura" icon={Send} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- Tab 3 · Nota fiscal ----------------

function InvoiceView({ b }: { b: BookingWithRelations }) {
  const qc = useQueryClient();
  const invoice = b.invoice;
  const status = invoice?.status ?? "pendente";
  const emit = useMutation({
    mutationFn: () => emitInvoice(b.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", b.id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Nota fiscal emitida");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Nota fiscal</CardTitle>
        <Pill tone={status === "emitida" ? "success" : undefined}>
          {invoiceStatusLabel[status]}
        </Pill>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-md text-sm text-muted-foreground">
          {status === "emitida"
            ? "Nota emitida para este ensaio."
            : "Emita a nota para este ensaio — os dados vêm do cadastro."}
        </p>
        {status === "emitida" ? (
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <Info label="Número da nota" value={invoice?.numero ?? "—"} />
            <Info
              label="Data de emissão"
              value={invoice?.issued_on ? formatDate(invoice.issued_on) : "—"}
            />
          </div>
        ) : (
          <Button onClick={() => emit.mutate()} disabled={emit.isPending}>
            <Receipt className="h-4 w-4" /> {emit.isPending ? "Emitindo…" : "Emitir nota fiscal"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- Tab 4 · Agendamento ----------------

function CalendarView({ b }: { b: BookingWithRelations }) {
  const synced = b.calendar_sync_status === "sincronizado";
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Agendamento · Google Calendar</CardTitle>
        <Pill tone={synced ? "success" : undefined}>
          {calendarStatusLabel[b.calendar_sync_status]}
        </Pill>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-md text-sm text-muted-foreground">
          {synced
            ? "Este ensaio já está no seu Google Calendar."
            : "Adicione este ensaio ao seu Google Calendar para que ele apareça na agenda."}
        </p>
        {!synced && <SoonButton label="Sincronizar com Google Calendar" icon={CalendarPlus} />}
      </CardContent>
    </Card>
  );
}

// ---------------- Compartilhados ----------------

/** Botão desabilitado com tooltip "Em breve" — integrações futuras. */
function SoonButton({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button variant="outline" disabled>
            <Icon className="h-4 w-4" /> {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Em breve</TooltipContent>
    </Tooltip>
  );
}

function Pill({ children, tone }: { children: ReactNode; tone?: "success" | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs",
        tone === "success"
          ? "border-success/30 bg-success/10 text-success"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function Info({ label, value, sub }: { label: string; value: string; sub?: string | undefined }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
      {sub && <div className="mt-0.5 text-sm text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Line({ l, v, strong }: { l: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{l}</span>
      <span className={strong ? "font-mono font-semibold tabular" : "font-medium"}>{v}</span>
    </div>
  );
}
