/**
 * ヘッダーコンポーネント
 * スタッフ用のシンプルなヘッダー
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut, User } from "lucide-react";
import { FullScreenLoading } from "@/components/ui/full-screen-loading";
import type { User as UserType } from "@/types";

interface HeaderProps {
  user: UserType;
}

/**
 * ヘッダー
 */
export const Header = ({ user }: HeaderProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  if (isLoggingOut) {
    return <FullScreenLoading message="ログアウト中..." />;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/icon-192x192.png"
            alt="SekoRepo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
            SekoRepo
          </h2>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative size-10 rounded-full p-0">
              <Avatar className="size-10 border-2 border-primary/20">
                <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user.name}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <User className="mr-2 size-4" />
                プロフィール
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                設定
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
