/**
 * スケルトンUIコンポーネント
 * ページ読み込み中の体感速度を改善
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * スタッフホーム画面のスケルトン
 */
export function StaffHomePageSkeleton() {
  return (
    <div className="flex-1 pb-24">
      {/* ウェルカムセクション */}
      <div className="flex p-6">
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="min-h-20 w-20 rounded-xl" />
            <div className="flex flex-col justify-center gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* レポート作成ボタン */}
      <div className="px-6 py-4">
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* 最近の送信セクション */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800"
            >
              <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
              <div className="flex flex-col flex-1 gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ダッシュボード画面のスケルトン
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 新着レポート */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton
                      key={j}
                      className="w-10 h-10 rounded-lg border-2 border-background"
                    />
                  ))}
                </div>
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 案件詳細画面のスケルトン
 */
export function ProjectDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* パンくずリスト */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* プロジェクトバナー */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 mb-8">
        <div className="flex items-start gap-6">
          <Skeleton className="w-32 h-32 rounded-lg flex-shrink-0" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* タブ */}
      <div className="border-b border-slate-200 dark:border-slate-800 mb-8">
        <div className="flex gap-8">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* 写真グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <PhotoCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * 写真カードのスケルトン（汎用）
 */
export function PhotoCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <Skeleton className="h-40 w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
