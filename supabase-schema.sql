-- =============================================================
-- OŠD Praha 3 – hodnocení zaměstnanců
-- Spusť celé v Supabase: SQL Editor → New query → vlož → Run.
-- Na server se NIKDY neukládá jméno zaměstnance, pouze kód (ZAM1...).
-- Každý uživatel (koordinátor) vidí jen svoje data (RLS).
-- =============================================================

-- NASTAVENÍ --------------------------------------------------
create table if not exists public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  kategorie jsonb not null default '[]'::jsonb,
  navrhla text not null default '',
  navrhla_funkce text not null default '',
  schvalila text not null default '',
  schvalila_funkce text not null default '',
  misto text not null default 'Praha',
  updated_at timestamptz not null default now()
);

-- ZAMĚSTNANCI (bez jmen – jen kódy) --------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kod text not null,
  pozice text not null default '',
  pohlavi text not null default 'zena',
  nastup text not null default '',
  aktivni boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, kod)
);
create index if not exists employees_user_idx on public.employees (user_id);

-- KOLA HODNOCENÍ (čtvrtletí) ---------------------------------
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  obdobi text not null,
  created_at timestamptz not null default now()
);
create index if not exists rounds_user_idx on public.rounds (user_id);

-- HODNOCENÍ JEDNOTLIVCŮ --------------------------------------
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  round_id uuid not null references public.rounds (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  generated jsonb,
  reward_amount text,
  status text not null default 'rozpracovano',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, employee_id)
);
create index if not exists evaluations_round_idx on public.evaluations (round_id);
create index if not exists evaluations_emp_idx on public.evaluations (employee_id);

-- RLS: každý vidí jen svoje ----------------------------------
alter table public.settings enable row level security;
alter table public.employees enable row level security;
alter table public.rounds enable row level security;
alter table public.evaluations enable row level security;

do $$
declare t text;
begin
  foreach t in array array['settings','employees','rounds','evaluations']
  loop
    execute format('drop policy if exists own_select on public.%I', t);
    execute format('drop policy if exists own_insert on public.%I', t);
    execute format('drop policy if exists own_update on public.%I', t);
    execute format('drop policy if exists own_delete on public.%I', t);
    execute format('create policy own_select on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy own_insert on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy own_update on public.%I for update using (auth.uid() = user_id)', t);
    execute format('create policy own_delete on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;
