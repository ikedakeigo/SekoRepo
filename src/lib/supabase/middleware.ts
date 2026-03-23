/**
 * Supabase 認証ミドルウェア
 * セッション更新と認証チェックを行う
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 認証不要なパス */
const PUBLIC_PATHS = ["/login", "/signup", "/onboarding"];

/** 管理者専用パス */
const ADMIN_PATHS = ["/dashboard", "/projects"];

/**
 * セッション更新と認証チェック
 */
export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;

  // 公開パスの場合はセッション更新不要（ログインページ以外）
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path)) && !pathname.startsWith("/login")) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
    cookies: {
      getAll: () => {
        return request.cookies.getAll();
      },
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ログインページの場合
  if (pathname.startsWith("/login")) {
    // 認証済みならリダイレクト
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      const redirectUrl =
        profile?.role === "admin" ? "/dashboard" : "/";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    // 未認証ならそのままログインページを表示
    return response;
  }

  // 未認証の場合はログインページにリダイレクト
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 管理者専用パスへのアクセスチェック
  if (ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
};
