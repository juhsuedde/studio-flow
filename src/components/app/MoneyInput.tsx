import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/format";

export function MoneyInput({ value, onChange, id, invalid }: { value: number; onChange: (cents: number) => void; id?: string; invalid?: boolean }) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      aria-invalid={invalid}
      className="tabular font-mono"
      value={formatBRL(value)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
        onChange(Number(digits || 0));
      }}
    />
  );
}
