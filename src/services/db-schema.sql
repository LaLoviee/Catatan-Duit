-- =======================================================
-- CatatDuit PostgreSQL Schema (Supabase)
-- Jalankan di SQL Editor Supabase (aman dijalankan ulang)
-- Tabel: profiles, categories, monthly_budgets,
-- expenses, category_limits, budget_topups + RLS + Trigger
-- =======================================================

create extension if not exists pgcrypto;

-- 1. Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text default 'Asia/Jakarta',
  created_at timestamptz default now()
);

-- 2. Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  icon text default 'Tag',
  color text default '#0F5132',
  sort_order int default 0,
  is_archived boolean default false
);
create unique index if not exists categories_user_name_unique
  on public.categories (user_id, lower(name));

-- 3. Monthly Budgets
create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  allowance_amount bigint not null check (allowance_amount >= 0),
  savings_target bigint not null default 0 check (savings_target >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint check_savings_target check (savings_target <= allowance_amount),
  constraint check_period_dates check (period_end >= period_start)
);
create index if not exists monthly_budgets_user_period
  on public.monthly_budgets (user_id, period_start desc);

-- 4. Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount bigint not null check (amount > 0 and amount <= 1000000000),
  spent_on date not null,
  note text check (char_length(note) <= 200),
  merchant text,
  source text default 'manual' check (source in ('manual', 'ocr')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create index if not exists expenses_user_spent_on
  on public.expenses (user_id, spent_on desc);
create index if not exists expenses_user_category
  on public.expenses (user_id, category_id, spent_on);

-- 5. Category Limits
create table if not exists public.category_limits (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.monthly_budgets(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  limit_amount bigint not null check (limit_amount > 0),
  unique (budget_id, category_id)
);

-- 6. Budget Topups
create table if not exists public.budget_topups (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.monthly_budgets(id) on delete cascade,
  amount bigint not null check (amount > 0),
  received_on date not null,
  note text
);

-- Row Level Security (RLS) Wajib
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.expenses enable row level security;
alter table public.category_limits enable row level security;
alter table public.budget_topups enable row level security;

-- Policies (aman dijalankan berulang)
drop policy if exists "Users can manage own profile" on public.profiles;
create policy "Users can manage own profile" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can manage own categories" on public.categories;
create policy "Users can manage own categories" on public.categories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own budgets" on public.monthly_budgets;
create policy "Users can manage own budgets" on public.monthly_budgets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own expenses" on public.expenses;
create policy "Users can manage own expenses" on public.expenses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own category limits" on public.category_limits;
create policy "Users can manage own category limits" on public.category_limits
  for all
  using (budget_id in (select id from public.monthly_budgets where user_id = auth.uid()))
  with check (budget_id in (select id from public.monthly_budgets where user_id = auth.uid()));

drop policy if exists "Users can manage own topups" on public.budget_topups;
create policy "Users can manage own topups" on public.budget_topups
  for all
  using (budget_id in (select id from public.monthly_budgets where user_id = auth.uid()))
  with check (budget_id in (select id from public.monthly_budgets where user_id = auth.uid()));

-- Trigger otomatis membuat profil dan 8 kategori bawaan saat user mendaftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(coalesce(new.email, 'Mahasiswa CatatDuit'), '@', 1)
  );

  insert into public.profiles (id, display_name, timezone)
  values (new.id, v_display_name, 'Asia/Jakarta')
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, icon, color, sort_order, is_archived)
  values
    (new.id, 'Makan', 'Utensils', '#C2410C', 1, false),
    (new.id, 'Transportasi', 'Bike', '#0369A1', 2, false),
    (new.id, 'Kuota/Pulsa', 'Wifi', '#6D28D9', 3, false),
    (new.id, 'Kos', 'Home', '#92400E', 4, false),
    (new.id, 'Hiburan', 'Gamepad2', '#BE185D', 5, false),
    (new.id, 'Kuliah', 'GraduationCap', '#0F766E', 6, false),
    (new.id, 'Belanja', 'ShoppingBag', '#0F5132', 7, false),
    (new.id, 'Lainnya', 'CircleEllipsis', '#3F3F46', 8, false)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
