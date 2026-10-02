import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, ListChecks, Pencil, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { saveBookingDraft } from "@/lib/data/bookings";
import { mockExtract } from "@/lib/data/extract";
import { deletePackage } from "@/lib/data/packages";
import { clientsQuery, packagesQuery } from "@/lib/data/queries";
import type { BookingDraft, Package, PaymentMethod } from "@/lib/data/types";
import { emptyDraft } from "@/lib/data/types";
import { formatBRL, formatDate, paymentMethodLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { MoneyInput } from "@/components/app/MoneyInput";
import { PackageDialog } from "@/components/app/PackageDialog";
import { LoadingRows } from "@/components/app/states";

type Errors = Partial<Record<keyof BookingDraft, string>>;
type SetDraft = (patch: Partial<BookingDraft>) => void;

const STEPS = ["Cliente", "Ensaio", "Financeiro", "Confirmação"] as const;

function validate(d: BookingDraft, step: number | "all"): Errors {
  const e: Errors = {};
  const s = (n: number) => step === "all" || step === n;
  if (s(0) && !d.clientName.trim()) e.clientName = "Obrigatório";
  if (s(0) && d.clientEmail && !/^\S+@\S+\.\S+$/.test(d.clientEmail)) e.clientEmail = "E-mail inválido";
  if (s(1)) {
    if (!d.packageId) e.packageId = "Selecione um pacote";
    if (!d.date) e.date = "Obrigatório";
    if (!d.time) e.time = "Obrigatório";
    if (!d.location.trim()) e.location = "Obrigatório";
  }
  if (s(2)) {
    if (d.totalCents <= 0) e.totalCents = "Informe o valor";
    if (!d.paymentMethod) e.paymentMethod = "Selecione";
    if (d.depositCents > d.totalCents) e.depositCents = "Entrada maior que o total";
  }
  return e;
}

export function BookingForm({ initial, bookingId }: { initial?: BookingDraft; bookingId?: string }) {
  const [draft, setDraftState] = useState<BookingDraft>(initial ?? emptyDraft());
  const [errors, setErrors] = useState<Errors>({});
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"form" | "text">(initial?.source === "ai_text" ? "text" : "form");
  const [extracted, setExtracted] = useState(!!initial);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const packages = useQuery(packagesQuery);

  const setDraft: SetDraft = (patch) => {
    setDraftState((d) => ({ ...d, ...patch }));
    setErrors((e) => {
      const n = { ...e };
      Object.keys(patch).forEach((k) => delete n[k as keyof BookingDraft]);
      return n;
    });
  };

  const save = useMutation({
    mutationFn: () => saveBookingDraft(draft, bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success(bookingId ? "Ensaio atualizado" : "Ensaio cadastrado");
      navigate({ to: "/ensaios" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const trySave = () => {
    const e = validate(draft, "all");
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Revise os campos obrigatórios");
      if (mode === "form") setStep(e.clientName || e.clientEmail ? 0 : e.packageId || e.date || e.time || e.location ? 1 : 2);
      return;
    }
    save.mutate();
  };

  const next = () => {
    const e = validate(draft, step);
    setErrors(e);
    if (!Object.keys(e).length) setStep((s) => s + 1);
  };

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as "form" | "text")}>
      <TabsList className="grid h-auto w-full grid-cols-2 p-1">
        <TabsTrigger value="form" className="gap-2 py-2.5">
          <ListChecks className="h-4 w-4" /> Formulário guiado
        </TabsTrigger>
        <TabsTrigger value="text" className="gap-2 py-2.5">
          <Sparkles className="h-4 w-4" /> Texto livre (IA)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="form" className="mt-5">
        <Stepper step={step} onJump={(i) => i < step && setStep(i)} />
        <Card className="mt-5">
          <CardContent className="pt-6">
            {step === 0 && <ClientFields draft={draft} setDraft={setDraft} errors={errors} />}
            {step === 1 && <BookingFields draft={draft} setDraft={setDraft} errors={errors} packages={packages.data} loading={packages.isLoading} />}
            {step === 2 && <FinanceFields draft={draft} setDraft={setDraft} errors={errors} />}
            {step === 3 && <Summary draft={draft} packages={packages.data ?? []} />}
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-between gap-2">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          {step < 3 ? (
            <Button onClick={next}>
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={trySave} disabled={save.isPending}>
              <Check className="h-4 w-4" /> {save.isPending ? "Salvando…" : "Salvar ensaio"}
            </Button>
          )}
        </div>
      </TabsContent>

      <TabsContent value="text" className="mt-5 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cole a mensagem com os dados do ensaio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={6}
              value={draft.rawText}
              onChange={(e) => setDraftState((d) => ({ ...d, rawText: e.target.value }))}
              placeholder='Ex: "Ensaio da Maria, pacote Ouro, sábado 10/10 às 15h, Parque Ibirapuera, R$ 1.200, metade no Pix"'
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Extração automática em breve — revise os campos</p>
              <Button
                disabled={!draft.rawText.trim() || packages.isLoading}
                onClick={() => {
                  // TODO(edge-function): chamar "extract-booking" (IA) em vez do mock local.
                  setDraftState((d) => mockExtract(d.rawText, packages.data ?? [], d));
                  setErrors({});
                  setExtracted(true);
                  toast.info("Campos preenchidos — revise antes de salvar");
                }}
              >
                <Wand2 className="h-4 w-4" /> Extrair informações
              </Button>
            </div>
          </CardContent>
        </Card>

        {extracted && (
          <>
            <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              Extração automática em breve — revise os campos
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">1 · Cliente</CardTitle></CardHeader>
              <CardContent><ClientFields draft={draft} setDraft={setDraft} errors={errors} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">2 · Ensaio</CardTitle></CardHeader>
              <CardContent><BookingFields draft={draft} setDraft={setDraft} errors={errors} packages={packages.data} loading={packages.isLoading} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">3 · Financeiro</CardTitle></CardHeader>
              <CardContent><FinanceFields draft={draft} setDraft={setDraft} errors={errors} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">4 · Confirmação</CardTitle></CardHeader>
              <CardContent><Summary draft={draft} packages={packages.data ?? []} /></CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={trySave} disabled={save.isPending}>
                <Check className="h-4 w-4" /> {save.isPending ? "Salvando…" : "Salvar ensaio"}
              </Button>
            </div>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((label, i) => (
        <li key={label}>
          <button type="button" onClick={() => onJump(i)} className="w-full text-left">
            <div className={cn("h-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
            <div className={cn("mt-2 flex items-center gap-1.5 text-xs", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>
              <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px]", i < step ? "border-primary bg-primary text-primary-foreground" : i === step ? "border-primary text-primary" : "")}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Field({ label, error, children, htmlFor, className }: { label: string; error?: string; children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ClientFields({ draft, setDraft, errors }: { draft: BookingDraft; setDraft: SetDraft; errors: Errors }) {
  const clients = useQuery(clientsQuery);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Cliente existente" className="sm:col-span-2">
        <Select
          value={draft.clientId ?? "new"}
          onValueChange={(v) => {
            if (v === "new") return setDraft({ clientId: null, clientName: "", clientPhone: "", clientEmail: "", clientCpf: "" });
            const c = clients.data?.find((x) => x.id === v);
            if (c) setDraft({ clientId: c.id, clientName: c.name, clientPhone: c.phone ?? "", clientEmail: c.email ?? "", clientCpf: c.cpf ?? "" });
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">+ Nova cliente</SelectItem>
            {clients.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Nome*" htmlFor="c-name" error={errors.clientName} className="sm:col-span-2">
        <Input id="c-name" value={draft.clientName} aria-invalid={!!errors.clientName} onChange={(e) => setDraft({ clientName: e.target.value })} />
      </Field>
      <Field label="Telefone" htmlFor="c-phone">
        <Input id="c-phone" inputMode="tel" value={draft.clientPhone} onChange={(e) => setDraft({ clientPhone: e.target.value })} placeholder="(11) 90000-0000" />
      </Field>
      <Field label="E-mail" htmlFor="c-email" error={errors.clientEmail}>
        <Input id="c-email" type="email" value={draft.clientEmail} onChange={(e) => setDraft({ clientEmail: e.target.value })} />
      </Field>
      <Field label="CPF (opcional)" htmlFor="c-cpf">
        <Input id="c-cpf" value={draft.clientCpf} onChange={(e) => setDraft({ clientCpf: e.target.value })} placeholder="000.000.000-00" />
      </Field>
    </div>
  );
}

function BookingFields({ draft, setDraft, errors, packages, loading }: { draft: BookingDraft; setDraft: SetDraft; errors: Errors; packages?: Package[]; loading: boolean }) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ open: boolean; pkg: Package | null }>({ open: false, pkg: null });
  const [toDelete, setToDelete] = useState<Package | null>(null);
  const del = useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["packages"] });
      if (draft.packageId === id) setDraft({ packageId: "" });
      toast.success("Pacote removido");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const pick = (p: Package) => setDraft({ packageId: p.id, ...(draft.totalCents === 0 ? { totalCents: p.price_cents } : {}) });

  return (
    <div className="space-y-5">
      <Field label="Pacote*" error={errors.packageId}>
        {loading ? (
          <LoadingRows rows={2} />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {packages?.filter((p) => p.active || p.id === draft.packageId).map((p) => (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => pick(p)}
                onKeyDown={(e) => e.key === "Enter" && pick(p)}
                className={cn(
                  "group relative cursor-pointer rounded-md border bg-card p-3 text-left transition-colors hover:border-primary/50",
                  draft.packageId === p.id && "border-primary ring-1 ring-primary",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{p.name}</span>
                  <div className="flex gap-0.5">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label="Editar pacote" onClick={(e) => { e.stopPropagation(); setDialog({ open: true, pkg: p }); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Remover pacote" onClick={(e) => { e.stopPropagation(); setToDelete(p); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="tabular font-mono text-sm text-primary">{formatBRL(p.price_cents)}</div>
                {p.description && <div className="mt-1 text-xs text-muted-foreground">{p.description}</div>}
              </div>
            ))}
            <button type="button" onClick={() => setDialog({ open: true, pkg: null })} className="flex min-h-20 items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:border-primary hover:text-primary">
              <Plus className="h-4 w-4" /> Adicionar pacote
            </button>
          </div>
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Data*" htmlFor="b-date" error={errors.date}>
          <Input id="b-date" type="date" value={draft.date} aria-invalid={!!errors.date} onChange={(e) => setDraft({ date: e.target.value })} />
        </Field>
        <Field label="Horário*" htmlFor="b-time" error={errors.time}>
          <Input id="b-time" type="time" value={draft.time} aria-invalid={!!errors.time} onChange={(e) => setDraft({ time: e.target.value })} />
        </Field>
        <Field label="Local*" htmlFor="b-loc" error={errors.location}>
          <Input id="b-loc" value={draft.location} aria-invalid={!!errors.location} onChange={(e) => setDraft({ location: e.target.value })} />
        </Field>
      </div>
      <PackageDialog open={dialog.open} pkg={dialog.pkg} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} onSaved={(p) => !dialog.pkg && pick(p)} />
      <ConfirmDelete open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title={`Remover pacote "${toDelete?.name}"?`} onConfirm={() => toDelete && del.mutate(toDelete.id)} />
    </div>
  );
}

function FinanceFields({ draft, setDraft, errors }: { draft: BookingDraft; setDraft: SetDraft; errors: Errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Valor total*" htmlFor="f-total" error={errors.totalCents}>
        <MoneyInput id="f-total" value={draft.totalCents} invalid={!!errors.totalCents} onChange={(v) => setDraft({ totalCents: v })} />
      </Field>
      <Field label="Valor de entrada (opcional)" htmlFor="f-dep" error={errors.depositCents}>
        <MoneyInput id="f-dep" value={draft.depositCents} invalid={!!errors.depositCents} onChange={(v) => setDraft({ depositCents: v })} />
      </Field>
      <Field label="Forma de pagamento*" error={errors.paymentMethod} className="sm:col-span-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(paymentMethodLabel) as PaymentMethod[]).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setDraft({ paymentMethod: m })}
              className={cn("rounded-md border bg-card px-3 py-2.5 text-sm hover:border-primary/50", draft.paymentMethod === m && "border-primary bg-accent font-medium text-accent-foreground")}
            >
              {paymentMethodLabel[m]}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Summary({ draft, packages }: { draft: BookingDraft; packages: Package[] }) {
  const pkg = packages.find((p) => p.id === draft.packageId);
  const rows: [string, [string, string][]][] = [
    ["Cliente", [["Nome", draft.clientName], ["Telefone", draft.clientPhone], ["E-mail", draft.clientEmail], ["CPF", draft.clientCpf]]],
    ["Ensaio", [["Pacote", pkg?.name ?? ""], ["Data", draft.date ? formatDate(draft.date, { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : ""], ["Horário", draft.time], ["Local", draft.location]]],
    ["Financeiro", [["Total", formatBRL(draft.totalCents)], ["Pagamento", draft.paymentMethod ? paymentMethodLabel[draft.paymentMethod] : ""], ["Entrada", formatBRL(draft.depositCents)], ["Restante", formatBRL(Math.max(0, draft.totalCents - draft.depositCents))]]],
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {rows.map(([title, items]) => (
        <div key={title} className="rounded-md border bg-muted/40 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
          <dl className="space-y-1.5 text-sm">
            {items.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className={cn("text-right font-medium", !v && "font-normal text-muted-foreground")}>{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
