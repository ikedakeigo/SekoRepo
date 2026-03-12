/**
 * 404 ページ
 */

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <FileQuestion className="size-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
          404
        </h1>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          ページが見つかりません
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">ホームに戻る</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">ダッシュボード</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
