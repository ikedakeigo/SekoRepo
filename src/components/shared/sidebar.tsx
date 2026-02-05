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
import {
  LayoutDashboard,
  Building2,
  FileText,
  Settings,
  LogOut,
  HardHat,
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
    icon: Building2,
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex md:flex-col">
      {/* ロゴエリア */}
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white">
          <HardHat className="size-5" />
        </div>
        <div className="flex flex-col">
          <Link href="/dashboard" className="text-slate-900 dark:text-white text-base font-bold leading-tight">
            SekoRepo
          </Link>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-normal">管理ポータル</p>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
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
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Icon className={cn("size-5", isActive && "fill-current")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ユーザー情報 */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2 mb-3">
          <Avatar className="size-8 border-2 border-slate-200 dark:border-slate-700">
            <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">管理者</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 size-4" />
          ログアウト
        </Button>
      </div>
    </aside>
  );
};
