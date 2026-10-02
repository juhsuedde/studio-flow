-- Schema final do banco, pronto para rodar no Supabase.
--
-- Não é executado hoje: o backend atual (src/server) o espelha em memória
-- (src/server/db) até o banco real entrar. Por isso cada regra aqui tem um
-- equivalente em código que garante o mesmo comportamento:
--   * enums + CHECKs  -> src/server/validation.ts (Zod)
--   * FKs             -> repositórios (validação antes de gravar)
--   * ON DELETE RESTRICT de bookings -> deleteClient/deletePackage devolvem 409
--   * deposit_cents <= total_cents   -> bookingCreate/bookingDraft/updateBooking
--   * diagnostics/contracts/invoices 1:1 com o ensaio, criadas junto -> createBooking
--   * RLS por owner_id -> todas as funções de repositório filtram por
--     session.user.id (a sessão de hoje é mock; quando o Supabase Auth entrar,
--     o JWT substitui o mock em src/server/session.ts sem mudar nenhuma rota)
create extension if not exists pgcrypto;

create type public.booking_status as enum ('pending', 'scheduled', 'confirmed', 'completed', 'cancelled');
create type public.payment_method as enum ('pix', 'card', 'cash', 'installments');
create type public.payment_status as enum ('pending', 'partial', 'paid');
create type public.booking_source as enum ('form', 'ai_text');
create type public.calendar_sync_status as enum ('nao_sincronizado', 'sincronizado');
create type public.contract_status as enum ('nao_gerado', 'gerado', 'enviado', 'assinado');
create type public.invoice_status as enum ('pendente', 'emitida');

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text,
  email text,
  cpf text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;
create policy "owners manage clients" on public.clients for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.packages to authenticated;
grant all on public.packages to service_role;
alter table public.packages enable row level security;
create policy "owners manage packages" on public.packages for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  package_id uuid not null references public.packages(id) on delete restrict,
  date date not null,
  time time not null,
  location text not null check (length(trim(location)) > 0),
  status public.booking_status not null default 'pending',
  total_cents integer not null check (total_cents >= 0),
  deposit_cents integer not null default 0 check (deposit_cents >= 0 and deposit_cents <= total_cents),
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending',
  source public.booking_source not null default 'form',
  raw_text text,
  calendar_sync_status public.calendar_sync_status not null default 'nao_sincronizado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "owners manage bookings" on public.bookings for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  conteudo jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.diagnostics to authenticated;
grant all on public.diagnostics to service_role;
alter table public.diagnostics enable row level security;
create policy "owners manage diagnostics" on public.diagnostics for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status public.contract_status not null default 'nao_gerado',
  -- TODO(edge-function): adicionar url/arquivo do PDF quando a geração real existir.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.contracts to authenticated;
grant all on public.contracts to service_role;
alter table public.contracts enable row level security;
create policy "owners manage contracts" on public.contracts for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status public.invoice_status not null default 'pendente',
  numero text,
  issued_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.invoices to authenticated;
grant all on public.invoices to service_role;
alter table public.invoices enable row level security;
create policy "owners manage invoices" on public.invoices for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create index clients_owner_idx on public.clients(owner_id);
create index packages_owner_idx on public.packages(owner_id);
create index bookings_owner_date_idx on public.bookings(owner_id, date, time);
create index bookings_client_idx on public.bookings(client_id);
create index diagnostics_booking_idx on public.diagnostics(booking_id);
create index contracts_booking_idx on public.contracts(booking_id);
create index invoices_booking_idx on public.invoices(booking_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger packages_updated_at before update on public.packages for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create trigger diagnostics_updated_at before update on public.diagnostics for each row execute function public.set_updated_at();
create trigger contracts_updated_at before update on public.contracts for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();