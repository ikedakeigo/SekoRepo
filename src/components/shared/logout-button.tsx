/**
 * ログアウトボタンコンポーネント
 */

"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth";
import { FullScreenLoading } from "@/components/ui/full-screen-loading";

export const LogoutButton = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  if (isLoggingOut) {
    return <FullScreenLoading message="ログアウト中..." />;
  }

  return (
    <Button
      variant="outline"
      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-900"
      onClick={handleLogout}
    >
      <LogOut className="size-4 mr-2" />
      ログアウト
    </Button>
  );
};
