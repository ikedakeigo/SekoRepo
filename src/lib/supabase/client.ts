/**
 * Supabase ブラウザクライアント
 * クライアントコンポーネントで使用
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ用Supabaseクライアントを作成
 * @returns Supabaseクライアント
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
