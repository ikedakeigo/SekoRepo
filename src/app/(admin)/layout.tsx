/**
 * 投稿担当者（管理者）用レイアウト
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { Sidebar } from "@/components/shared/sidebar";

const AdminLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 管理者以外はホームにリダイレクト
  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <main className="md:pl-64">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
