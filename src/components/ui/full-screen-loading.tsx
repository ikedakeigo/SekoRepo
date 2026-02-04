/**
 * フルスクリーンローディングコンポーネント
 * 認証処理など画面遷移を伴う操作時に表示
 */

import { Loader2 } from "lucide-react";

interface FullScreenLoadingProps {
  message?: string;
}

/**
 * フルスクリーンローディング
 */
export const FullScreenLoading = ({
  message = "読み込み中...",
}: FullScreenLoadingProps) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-label={message}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
};
