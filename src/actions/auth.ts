/**
 * 認証関連のServer Actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { User, UserRole } from "@/types";

/**
 * ログイン
 * @param formData - フォームデータ（email, password）
 * @returns エラーメッセージ（成功時はリダイレクト）
 */
export const login = async (formData: FormData) => {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください" };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" };
  }

  // ユーザーのロールを取得してリダイレクト先を決定
  const user = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: { role: true },
  });

  revalidatePath("/", "layout");

  if (user?.role === "admin") {
    redirect("/dashboard");
  } else {
    redirect("/");
  }
};

/**
 * 新規登録
 * @param formData - フォームデータ（email, password, name）
 * @returns エラーメッセージ（成功時はリダイレクト）
 */
export const signup = async (formData: FormData) => {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "すべての項目を入力してください" };
  }

  // パスワードバリデーション（8文字以上、小文字・数字を含む）
  const passwordRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    return {
      error:
        "パスワードは8文字以上で、小文字・数字を含めてください",
    };
  }

  // Supabase Authでユーザー作成
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "このメールアドレスは既に登録されています" };
    }
    return { error: "登録に失敗しました。もう一度お試しください" };
  }

  if (!data.user) {
    return { error: "ユーザーの作成に失敗しました" };
  }

  // Prisma DBにユーザー情報を登録
  try {
    await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        name,
        role: "staff", // デフォルトはスタッフ
      },
    });
  } catch (dbError) {
    // DB登録失敗時はAuthユーザーを削除（ロールバック）
    await supabase.auth.admin.deleteUser(data.user.id).catch(() => {
      // Admin権限がない場合は無視
    });
    return { error: "ユーザー情報の登録に失敗しました" };
  }

  revalidatePath("/", "layout");
  redirect("/");
};

/**
 * ログアウト
 */
export const logout = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
};

/**
 * 現在のユーザーを取得
 * @returns ユーザー情報（未認証時はnull）
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * 認証ユーザーのIDを取得（内部用）
 * @returns ユーザーID
 * @throws 未認証の場合はエラー
 */
export const requireAuth = async (): Promise<string> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("認証が必要です");
  }

  return user.id;
};

/**
 * 管理者権限を確認（内部用）
 * @returns ユーザーID
 * @throws 管理者でない場合はエラー
 */
export const requireAdmin = async (): Promise<string> => {
  const userId = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    throw new Error("管理者権限が必要です");
  }

  return userId;
};
