-- ============================================================
-- FachowiecPRO — schemat bazy Supabase
-- Uruchom CAŁOŚĆ w panelu Supabase: SQL Editor → New query → wklej → Run
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- TABELE ----------

create table public.clients (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  city text not null default '',
  email text not null,
  created date not null default current_date
);

create table public.companies (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  city text not null default '',
  email text not null,
  address text not null default '',
  nip text not null default '',
  phone text not null default '',
  "desc" text not null default '',
  cats text[] not null default '{}',
  plan text not null default 'start',
  verified boolean not null default false,
  joined date not null default current_date,
  offers_used int not null default 0,
  paid_jobs uuid[] not null default '{}'
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients on delete cascade,
  title text not null,
  cat text not null,
  city text not null default '',
  budget text not null default 'do uzgodnienia',
  area text not null default '',
  length text not null default '',
  deadline date,
  photos text[] not null default '{}',
  "desc" text not null default '',
  urgent boolean not null default false,
  status text not null default 'open' check (status in ('open','in_progress','completed','archived')),
  accepted_company uuid references public.companies,
  reviewed boolean not null default false,
  created date not null default current_date
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs on delete cascade,
  company_id uuid not null references public.companies on delete cascade,
  price text not null,
  "start" date,
  days int,
  msg text not null default '',
  accepted boolean not null default false,
  date date not null default current_date,
  unique (job_id, company_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  job_id uuid references public.jobs on delete set null,
  client_id uuid references public.clients on delete set null,
  client_name text not null,
  date date not null default current_date,
  stars int not null check (stars between 1 and 5),
  crit jsonb not null default '{}',
  text text not null default '',
  recommend boolean not null default true
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs on delete cascade,
  sender_id uuid not null,
  sender_type text not null check (sender_type in ('client','company')),
  name text not null,
  text text not null,
  ts timestamptz not null default now()
);

-- ---------- ROW LEVEL SECURITY ----------

alter table public.clients   enable row level security;
alter table public.companies enable row level security;
alter table public.jobs      enable row level security;
alter table public.offers    enable row level security;
alter table public.reviews   enable row level security;
alter table public.messages  enable row level security;

-- Profile: publicznie czytelne, edycja tylko własnego
create policy "clients select"  on public.clients   for select using (true);
create policy "clients insert"  on public.clients   for insert with check (auth.uid() = id);
create policy "clients update"  on public.clients   for update using (auth.uid() = id);

create policy "companies select" on public.companies for select using (true);
create policy "companies insert" on public.companies for insert with check (auth.uid() = id);
create policy "companies update" on public.companies for update using (auth.uid() = id);

-- Zlecenia: publicznie czytelne, dodaje/edytuje właściciel (klient)
create policy "jobs select" on public.jobs for select using (true);
create policy "jobs insert" on public.jobs for insert with check (auth.uid() = client_id);
create policy "jobs update" on public.jobs for update using (auth.uid() = client_id);
create policy "jobs delete" on public.jobs for delete using (auth.uid() = client_id);

-- Oferty: pełne dane widzi TYLKO właściciel zlecenia i firma-autor.
-- Reszta świata widzi wyłącznie widok offers_public (cena, bez firmy).
create policy "offers select" on public.offers for select using (
  company_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.client_id = auth.uid())
);
create policy "offers insert" on public.offers for insert with check (company_id = auth.uid());
create policy "offers update by job owner" on public.offers for update using (
  exists (select 1 from public.jobs j where j.id = job_id and j.client_id = auth.uid())
);

-- Oceny: publiczne, wystawia klient w swoim imieniu
create policy "reviews select" on public.reviews for select using (true);
create policy "reviews insert" on public.reviews for insert with check (auth.uid() = client_id);

-- Komunikator: tylko strony danego zlecenia
create policy "messages select" on public.messages for select using (
  exists (select 1 from public.jobs j where j.id = job_id
          and (j.client_id = auth.uid() or j.accepted_company = auth.uid()))
);
create policy "messages insert" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from public.jobs j where j.id = job_id
              and (j.client_id = auth.uid() or j.accepted_company = auth.uid()))
);

-- Publiczny widok ofert: tylko cena i status — celowo omija RLS (security definer)
create view public.offers_public as
  select id, job_id, price, accepted, date from public.offers;
grant select on public.offers_public to anon, authenticated;

-- ---------- STORAGE (zdjęcia zleceń) ----------

insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

create policy "job photos upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'job-photos');

-- ============================================================
-- FORUM SPOŁECZNOŚCI (wątki + komentarze)
-- Dopisane: uruchom ten fragment w SQL Editor, jeśli reszta już istnieje.
-- ============================================================

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  author_id uuid not null references auth.users on delete cascade,
  author_name text not null,
  author_type text not null default 'client' check (author_type in ('client','company')),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created timestamptz not null default now()
);
create index if not exists forum_posts_cat_idx on public.forum_posts (category, created desc);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts on delete cascade,
  author_id uuid not null references auth.users on delete cascade,
  author_name text not null,
  author_type text not null default 'client' check (author_type in ('client','company')),
  body text not null,
  created timestamptz not null default now()
);
create index if not exists forum_comments_post_idx on public.forum_comments (post_id, created);

alter table public.forum_posts    enable row level security;
alter table public.forum_comments enable row level security;

-- Wątki: czyta każdy; pisze/edytuje/usuwa zalogowany autor we własnym imieniu
create policy "forum_posts select" on public.forum_posts for select using (true);
create policy "forum_posts insert" on public.forum_posts for insert with check (auth.uid() = author_id);
create policy "forum_posts update" on public.forum_posts for update using (auth.uid() = author_id);
create policy "forum_posts delete" on public.forum_posts for delete using (auth.uid() = author_id);

-- Komentarze: analogicznie
create policy "forum_comments select" on public.forum_comments for select using (true);
create policy "forum_comments insert" on public.forum_comments for insert with check (auth.uid() = author_id);
create policy "forum_comments update" on public.forum_comments for update using (auth.uid() = author_id);
create policy "forum_comments delete" on public.forum_comments for delete using (auth.uid() = author_id);

-- ============================================================
-- USUWANIE WŁASNEGO KONTA
-- Funkcja kasuje WYŁĄCZNIE konto zalogowanego użytkownika (auth.uid()).
-- Nie przyjmuje żadnego ID z zewnątrz => nikt nie usunie cudzego konta.
-- Usunięcie z auth.users kaskaduje (ON DELETE CASCADE) do clients/companies,
-- a stąd dalej do jobs, offers, reviews, messages, forum_posts, forum_comments.
-- Uruchom w SQL Editor, jeśli reszta schematu już istnieje.
-- ============================================================
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Brak zalogowanego użytkownika';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
