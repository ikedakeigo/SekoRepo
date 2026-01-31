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
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header user={user} />
      <main className="max-w-md mx-auto">{children}</main>
      <MobileNav />
    </div>
  );
};

export default StaffLayout;
