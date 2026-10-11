-- Корзина админки: копия каждой удалённой записи хранится 30 дней.
-- Выполни один раз в Supabase → SQL Editor. Доступа для anon нет.

create table if not exists public.trash (
  id bigint generated always as identity primary key,
  deleted_at timestamptz not null default now(),
  table_name text not null,
  row_key text,
  deleted_by text,
  data jsonb not null
);

create index if not exists trash_deleted_at_idx on public.trash (deleted_at desc);

alter table public.trash enable row level security;
revoke all on public.trash from anon, authenticated;
