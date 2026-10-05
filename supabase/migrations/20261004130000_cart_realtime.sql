-- Realtime cart sync between web and mobile.
-- Publishes cart_items changes to Supabase Realtime. RLS still decides which
-- INSERT/UPDATE events a subscriber receives (owner only). DELETE events under RLS
-- carry only the primary key, so clients treat them as "something changed" and refetch.
-- No schema or policy change.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cart_items'
  ) then
    alter publication supabase_realtime add table public.cart_items;
  end if;
end $$;
