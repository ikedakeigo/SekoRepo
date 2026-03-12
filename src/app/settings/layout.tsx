/**
 * 設定画面レイアウト
 * ロールに応じてスタッフ用/管理者用のレイアウトを切り替え
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { Header } from "@/components/shared/header";
import { MobileNav } from "@/components/shared/mobile-nav";
import { Sidebar } from "@/components/shared/sidebar";

const SettingsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar user={user} />
        <main className="md:pl-64 bg-background min-h-screen">
          <div className="py-6 px-8">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background overflow-x-hidden max-w-[480px] mx-auto border-x border-slate-200 dark:border-slate-800 shadow-xl">
      <Header user={user} />
      <main className="flex-1 pb-20">{children}</main>
      <MobileNav />
    </div>
  );
};

export default SettingsLayout;
