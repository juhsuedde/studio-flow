import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Camera, CalendarDays, LayoutDashboard, Package, Plus, Users } from "lucide-react";
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
    <div className="min-h-screen lg:pl-56">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-28 items-center gap-3 px-6">
          <Camera className="h-7 w-7 shrink-0 text-sidebar-primary" strokeWidth={1.7} />
          <div>
            <span className="block text-xl font-extrabold text-sidebar-accent-foreground">estúdio.</span>
            <span className="text-[11px]">Gestão de ensaios</span>
          </div>
        </div>
        <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-2 px-4 py-4">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className: "bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
              }}
            >
              <n.icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              {n.label === "Novo" ? "Novo ensaio" : n.label}
            </Link>
          ))}
        </nav>
        <div className="mx-6 mb-7 border-t border-sidebar-border pt-4 text-[11px] leading-relaxed text-sidebar-foreground">
          Estúdio · Back-office
          <span className="mt-1 block text-sidebar-foreground/70">Modo demonstração</span>
        </div>
      </aside>

      <main className="mx-auto max-w-7xl px-5 pb-28 pt-5 sm:px-8 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-center border-b pb-4 sm:mb-10">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <Camera className="h-4 w-4 shrink-0 lg:hidden" />
            <span className="font-semibold text-foreground">Estúdio</span>
            <span aria-hidden="true">/</span>
            <span className="truncate">Gestão de ensaios</span>
          </div>
          <Link to="/ensaios/novo" aria-label="Cadastrar novo ensaio" className="ml-3 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-studio-yellow text-foreground transition-colors hover:bg-secondary">
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {children}
      </main>

      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: true }}
            className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 py-2 text-[11px] text-muted-foreground"
            activeProps={{ className: "bg-secondary text-primary font-bold" }}
          >
            <n.icon className="h-5 w-5 shrink-0" strokeWidth={1.7} />
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
    <div className="mb-7 grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
