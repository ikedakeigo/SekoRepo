/**
 * 現場スタッフ用レイアウト
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { Header } from "@/components/shared/header";
import { MobileNav } from "@/components/shared/mobile-nav";

const StaffLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 管理者はダッシュボードにリダイレクト
  if (user.role === "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background overflow-x-hidden max-w-[480px] mx-auto border-x border-slate-200 dark:border-slate-800 shadow-xl">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <MobileNav />
    </div>
  );
};

export default StaffLayout;
