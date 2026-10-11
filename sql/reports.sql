-- Репорты пользователей: «Ошибка в цвете» и «Предложить машину».
-- Выполни один раз в Supabase → SQL Editor (до деплоя новой версии).
--
-- Доступа для anon нет вообще: пишет только api/report.js (service_role),
-- читает только api/admin-reports.js после проверки токена админа.
-- ip_hash — SHA-256 от IP с солью, сам IP не хранится; по нему считаются
-- лимиты отправки.

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('color_error', 'new_vehicle')),
  vehicle_slug text,
  color_id text,
  message text not null check (char_length(message) between 5 and 1000),
  contact text check (contact is null or char_length(contact) <= 120),
  payload jsonb,
  status text not null default 'new' check (status in ('new', 'accepted', 'rejected')),
  ip_hash text,
  edited_by text,
  edited_at timestamptz
);

create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists reports_ip_created_idx on public.reports (ip_hash, created_at desc);

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;

-- edited_at обновляется сам при смене статуса
create or replace function public.reports_touch_edited_at()
returns trigger
language plpgsql
as $$
begin
  new.edited_at := now();
  return new;
end;
$$;

drop trigger if exists reports_touch_edited_at on public.reports;
create trigger reports_touch_edited_at
  before update on public.reports
  for each row execute function public.reports_touch_edited_at();
