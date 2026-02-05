/**
 * 現場スタッフ用ホーム画面
 */

import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/actions/auth";
import { getUserReports } from "@/actions/reports";
import { Camera, ChevronRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const HomePage = async () => {
  const user = await getCurrentUser();
  const recentReports = await getUserReports(5);

  // 最新のレポートから案件情報を取得
  const latestProject = recentReports.length > 0 ? recentReports[0] : null;

  return (
    <div className="flex-1 pb-24">
      {/* ウェルカムセクション */}
      <div className="flex p-6">
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center gap-4">
            {latestProject?.thumbnailUrl ? (
              <div className="relative min-h-20 w-20 rounded-xl overflow-hidden shadow-sm">
                <Image
                  src={latestProject.thumbnailUrl}
                  alt="現場写真"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="min-h-20 w-20 rounded-xl bg-slate-200 dark:bg-slate-700 shadow-sm" />
            )}
            <div className="flex flex-col justify-center">
              <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">
                こんにちは、{user?.name || "ゲスト"}さん
              </p>
              {latestProject && (
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 uppercase tracking-wider">
                  {latestProject.projectName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* レポート作成ボタン */}
      <div className="px-6 py-4">
        <Link href="/report/new">
          <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-20 px-6 bg-primary text-white gap-4 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors active:scale-[0.98]">
            <Camera className="size-7" />
            <span className="text-xl font-bold">レポートを作成</span>
          </button>
        </Link>
      </div>

      {/* 最近の送信セクション */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
            最近の送信
          </h2>
          <Link
            href="/history"
            className="text-primary text-sm font-semibold hover:underline"
          >
            すべて見る
          </Link>
        </div>

        <div className="space-y-3">
          {recentReports.length > 0 ? (
            recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/history/${report.id}`}
                className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
              >
                {report.thumbnailUrl ? (
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={report.thumbnailUrl}
                      alt={report.projectName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                )}
                <div className="flex flex-col flex-1 justify-center min-w-0">
                  <p className="text-slate-900 dark:text-white text-lg font-semibold leading-tight truncate">
                    {report.projectName}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-normal mt-1 flex items-center gap-1">
                    <Clock className="size-4" />
                    {format(new Date(report.createdAt), "M月d日 HH:mm", {
                      locale: ja,
                    })}
                    <span className="mx-1">|</span>
                    写真{report.photoCount}枚
                  </p>
                </div>
                <div className="shrink-0">
                  <ChevronRight className="size-5 text-slate-400" />
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                まだ送信履歴がありません
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                最初のレポートを送信してみましょう
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
