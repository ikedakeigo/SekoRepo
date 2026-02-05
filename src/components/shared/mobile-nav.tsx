/**
 * モバイルナビゲーションコンポーネント
 * スマホ用の下部固定ナビゲーション
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Send, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/** ナビゲーションアイテム */
const navItems = [
  {
    href: "/",
    label: "ホーム",
    icon: Home,
  },
  {
    href: "/report/new",
    label: "送信",
    icon: Send,
  },
  {
    href: "/history",
    label: "履歴",
    icon: History,
  },
  {
    href: "/settings",
    label: "設定",
    icon: Settings,
  },
];

/**
 * モバイルナビゲーション
 */
export const MobileNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 md:hidden">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-slate-400 dark:text-slate-500 hover:text-primary"
              )}
            >
              <Icon className={cn("size-6", isActive && "stroke-[2.5]")} />
              <span className={cn(
                "text-xs",
                isActive ? "font-bold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
