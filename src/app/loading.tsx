/**
 * ルートレベルのローディングUI
 *
 * 各レイアウト（(staff) / (admin) / calendar / settings）は描画前に認証ユーザーを
 * await するため、レイアウト自身を覆うSuspense境界がないと解決するまで body が
 * 空のままになる（モバイルでは数秒間の白画面として見える）。
 * このファイルがその境界のフォールバックとなり、初回表示・リロード時に
 * 即座にローディングを描画する。
 */

import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background"
      role="status"
      aria-label="読み込み中"
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">読み込み中...</p>
    </div>
  );
};

export default Loading;
