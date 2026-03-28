-- Smart Receipt AI — run in Supabase SQL editor (or migrate via CLI).
-- Create a public Storage bucket named `receipts` and allow public read if using getPublicUrl.

create extension if not exists "pgcrypto";

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  merchant text not null,
  date text not null,
  total numeric not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts (id) on delete cascade,
  name text not null,
  category text not null,
  price numeric not null,
  quantity int
);

create index if not exists idx_receipts_user_created on public.receipts (user_id, created_at desc);
create index if not exists idx_items_receipt on public.items (receipt_id);

alter table public.receipts enable row level security;
alter table public.items enable row level security;

-- Demo / hackathon: open policies (tighten before real production + auth).
create policy "receipts_all_demo" on public.receipts for all using (true) with check (true);
create policy "items_all_demo" on public.items for all using (true) with check (true);
