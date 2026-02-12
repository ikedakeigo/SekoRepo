/**
 * オンボーディング用レイアウト（認証不要）
 * サインアップ前にアプリを紹介する
 * ログイン済みユーザーはホームまたはダッシュボードへリダイレクト
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";

const OnboardingLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const user = await getCurrentUser();

  // ログイン済みならリダイレクト
  if (user) {
    if (user.role === "admin") {
      redirect("/dashboard");
    }
    redirect("/");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background max-w-[480px] mx-auto">
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
};

export default OnboardingLayout;
