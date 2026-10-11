-- Счётчики популярности (блок «Популярное» на главной).
-- Выполни один раз в Supabase → SQL Editor. Доступа для anon нет:
-- пишет api/track.js, читает api/popular.js (оба — ключом service_role).

create table if not exists public.hits (
  kind text not null check (kind in ('vehicle', 'color')),
  key text not null,
  count bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (kind, key)
);

create index if not exists hits_kind_count_idx on public.hits (kind, count desc);

alter table public.hits enable row level security;
revoke all on public.hits from anon, authenticated;

create or replace function public.track_hit(p_kind text, p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.hits (kind, key, count) values (p_kind, p_key, 1)
  on conflict (kind, key) do update set count = public.hits.count + 1, updated_at = now();
$$;

revoke all on function public.track_hit(text, text) from public, anon, authenticated;
grant execute on function public.track_hit(text, text) to service_role;
