-- Журнал изменений админки. Выполни один раз в Supabase → SQL Editor.
-- Читать и писать может только сервер (service_role) — для anon доступа нет.

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  table_name text not null,
  row_key text,
  action text not null,
  edited_by text,
  old_data jsonb,
  new_data jsonb
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
