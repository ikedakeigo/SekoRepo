/**
 * サイドバーコンポーネント
 * 管理者用のPC向けサイドバー
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FullScreenLoading } from "@/components/ui/full-screen-loading";
import type { User } from "@/types";

/** ナビゲーションアイテム */
const navItems = [
  {
    href: "/dashboard",
    label: "ダッシュボード",
    icon: LayoutDashboard,
  },
  {
    href: "/projects",
    label: "案件一覧",
    icon: FolderOpen,
  },
  {
    href: "/settings",
    label: "設定",
    icon: Settings,
  },
];

interface SidebarProps {
  user: User;
}

/**
 * サイドバー
 */
export const Sidebar = ({ user }: SidebarProps) => {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  if (isLoggingOut) {
    return <FullScreenLoading message="ログアウト中..." />;
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background hidden md:block">
      <div className="flex h-full flex-col">
        {/* ロゴ */}
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-bold">SekoRepo</span>
          </Link>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* ユーザー情報 */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </div>
    </aside>
  );
};
