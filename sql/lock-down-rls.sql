-- Закрывает запись для anon-ключа: после этого скрипта браузер может
-- ТОЛЬКО ЧИТАТЬ таблицы. Вся запись идёт через api/admin-db.js ключом
-- service_role (он обходит RLS).
--
-- ВАЖНО: выполняй ПОСЛЕ того, как новая версия задеплоена на Vercel и
-- заданы ADMIN_USERS / ADMIN_SESSION_SECRET / SUPABASE_SERVICE_KEY.
-- Иначе старая админка перестанет сохранять изменения.
--
-- Скрипт удаляет ВСЕ прежние политики этих таблиц и создаёт одну —
-- публичное чтение. Выполнять в Supabase → SQL Editor.

do $$
declare
  t text;
  p record;
begin
  foreach t in array array['vehicles', 'tags', 'tag_groups', 'credit_groups', 'credit_entries']
  loop
    execute format('alter table public.%I enable row level security', t);

    for p in
      select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;

    execute format(
      'create policy "public read" on public.%I for select to anon, authenticated using (true)',
      t
    );

    execute format(
      'revoke insert, update, delete, truncate on public.%I from anon, authenticated',
      t
    );
  end loop;
end
$$;

-- Проверка (должна вернуть по одной строке "public read / SELECT" на таблицу):
-- select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by 1;
