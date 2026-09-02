/**
 * 認証セッション取得（サーバー専用・リクエスト単位でメモ化）
 *
 * レイアウト → ページ → Server Action と同じリクエスト内で何度も
 * 認証情報を参照するため、React の cache() で重複呼び出しを排除する。
 * これがないと 1 ページ表示ごとに Supabase Auth への往復と
 * ユーザー取得クエリが 3〜4 回発生し、TTFB がその分だけ伸びる。
 *
 * Server Action としては公開しないため "use server" は付けない。
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User, UserRole } from "@/types";

/**
 * Supabase Auth の認証ユーザーを取得
 * @returns 認証ユーザー（未認証時はnull）
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

/**
 * アプリケーションのユーザー情報を取得
 * @returns ユーザー情報（未認証・未登録時はnull）
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const authUser = await getAuthUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    avatarUrl: user.avatarUrl,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
});

/**
 * 認証ユーザーのIDを取得
 * @returns ユーザーID
 * @throws 未認証の場合はエラー
 */
export const requireAuth = cache(async (): Promise<string> => {
  const authUser = await getAuthUser();

  if (!authUser) {
    throw new Error("認証が必要です");
  }

  return authUser.id;
});

/**
 * 管理者権限を確認
 * @returns ユーザーID
 * @throws 管理者でない場合はエラー
 */
export const requireAdmin = cache(async (): Promise<string> => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("認証が必要です");
  }

  if (user.role !== "admin") {
    throw new Error("管理者権限が必要です");
  }

  return user.id;
});
