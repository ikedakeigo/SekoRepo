/**
 * グローバルエラーページ
 */

"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ErrorPage = ({ error, reset }: ErrorProps) => {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
          <AlertTriangle className="size-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          エラーが発生しました
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          予期しないエラーが発生しました。もう一度お試しください。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>もう一度試す</Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
