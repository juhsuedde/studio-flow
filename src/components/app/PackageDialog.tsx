import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createPackage, updatePackage } from "@/lib/data/packages";
import type { Package } from "@/lib/data/types";
import { MoneyInput } from "./MoneyInput";

export function PackageDialog({
  open,
  onOpenChange,
  pkg,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pkg?: Package | null;
  onSaved?: (p: Package) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(60);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(pkg?.name ?? "");
    setDescription(pkg?.description ?? "");
    setPrice(pkg?.price_cents ?? 0);
    setDuration(pkg?.duration_minutes ?? 60);
    setActive(pkg?.active ?? true);
  }, [open, pkg]);

  const m = useMutation({
    mutationFn: () => {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
        price_cents: price,
        duration_minutes: duration,
        active,
      };
      return pkg ? updatePackage(pkg.id, input) : createPackage(input);
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["packages"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(pkg ? "Pacote atualizado" : "Pacote criado");
      onSaved?.(p);
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pkg ? "Editar pacote" : "Novo pacote"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              toast.error("Informe o nome do pacote");
              return;
            }
            m.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pkg-name">Nome*</Label>
            <Input id="pkg-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-desc">Descrição</Label>
            <Textarea
              id="pkg-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-price">Preço</Label>
              <MoneyInput id="pkg-price" value={price} onChange={setPrice} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pkg-dur">Duração (min)</Label>
              <Input
                id="pkg-dur"
                type="number"
                min={15}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={active} onCheckedChange={setActive} /> Ativo
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
