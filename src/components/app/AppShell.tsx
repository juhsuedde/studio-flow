import { Link } from "@tanstack/react-router";
import { CalendarDays, LayoutDashboard, Package, Plus, Users } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/ensaios", label: "Ensaios", icon: CalendarDays },
  { to: "/ensaios/novo", label: "Novo", icon: Plus },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/pacotes", label: "Pacotes", icon: Package },
] as const;

// TODO(auth): envolver com guarda de sessão Supabase Auth (rota _authenticated) quando o backend existir.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
            E
          </div>
          <span className="text-sm font-semibold text-sidebar-accent-foreground">
            Estúdio · Back-office
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              }}
            >
              <n.icon className="h-4 w-4" />
              {n.label === "Novo" ? "Novo ensaio" : n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/60">
          Dados locais (modo demonstração)
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card md:hidden">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: true }}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary font-medium" }}
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
