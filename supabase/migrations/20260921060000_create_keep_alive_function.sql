-- Supabase 無料プランの自動一時停止（7日間アクセスなし）を防ぐための ping 用 RPC。
--
-- テーブルを一切参照しないため SECURITY INVOKER（デフォルト）のままで安全。
-- RLS が有効なテーブルを select する方式だと、ポリシー次第で anon が弾かれて
-- ping が失敗するため、専用関数を用意している。
create or replace function public.keep_alive()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select now() $$;

comment on function public.keep_alive() is
  'Supabase無料プランの自動一時停止を防ぐためのping用。GitHub Actions (.github/workflows/supabase-keep-alive.yml) から毎日呼ばれる。';

-- 明示的に anon / authenticated のみに実行権限を与える
revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;
