/**
 * 日付別レポートリストコンポーネント
 * 日付ごとにグループ化されたレポートをグリッド表示
 */

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/shared";
import {
  ChevronDown,
  User,
  Download,
  Check,
  Circle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toggleDatePostedStatus } from "@/actions/projects";
import { deleteReport } from "@/actions/reports";
import { exportProjectByDateToCSV } from "@/actions/export";
import { toast } from "sonner";

interface Photo {
  id: string;
  photoUrl: string;
  photoType: string;
  title: string;
  comment?: string | null;
  customerFeedback?: string | null;
  sortOrder: number;
}

interface Report {
  id: string;
  createdAt: Date;
  summary?: string | null;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  photos: Photo[];
}

interface ReportDateListProps {
  projectId: string;
  projectName: string;
  reports: Report[];
  postedDates: string[];
}

/** 日付文字列でグループ化するためのキーを取得 */
const getDateKey = (date: Date) => {
  return format(new Date(date), "yyyy-MM-dd");
};

/** 日付ごとにレポートをグループ化 */
const groupReportsByDate = (reports: Report[]) => {
  const grouped: Record<string, Report[]> = {};

  reports.forEach((report) => {
    const key = getDateKey(report.createdAt);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(report);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => ({
    date: key,
    reports: grouped[key],
    photoCount: grouped[key].reduce((sum, r) => sum + r.photos.length, 0),
  }));
};

/**
 * 日付別レポートリスト
 */
export const ReportDateList = ({
  projectId,
  projectName,
  reports,
  postedDates,
}: ReportDateListProps) => {
  const [isPending, startTransition] = useTransition();
  const [localPostedDates, setLocalPostedDates] = useState<Set<string>>(
    new Set(postedDates)
  );
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [localReports, setLocalReports] = useState<Report[]>(reports);
  const [downloadingDate, setDownloadingDate] = useState<string | null>(null);

  const groupedReports = groupReportsByDate(localReports);

  const handleTogglePosted = (date: string, e: React.MouseEvent) => {
    e.stopPropagation();

    setLocalPostedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });

    startTransition(async () => {
      await toggleDatePostedStatus(projectId, date);
    });
  };

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(photo.photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${photo.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    setDeletingReportId(reportId);

    setLocalReports((prev) => prev.filter((r) => r.id !== reportId));

    startTransition(async () => {
      try {
        await deleteReport(reportId);
        toast.success("レポートを削除しました");
      } catch (error) {
        setLocalReports(reports);
        toast.error("削除に失敗しました");
        console.error("Delete failed:", error);
      } finally {
        setDeletingReportId(null);
      }
    });
  };

  const handleDateCSVDownload = async (date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingDate(date);

    try {
      const csvData = await exportProjectByDateToCSV(projectId, date);

      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const dateForFileName = date.replace(/-/g, "");
      const fileName = `${projectName}_${dateForFileName}.csv`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSVファイルをダウンロードしました");
    } catch (error) {
      console.error("CSV download error:", error);
      toast.error("ダウンロードに失敗しました");
    } finally {
      setDownloadingDate(null);
    }
  };

  if (localReports.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        まだレポートがありません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedReports.map(({ date, reports: dateReports, photoCount }, index) => {
        const isPosted = localPostedDates.has(date);
        const dateObj = new Date(date);
        const isToday = getDateKey(new Date()) === date;
        const displayDate = isToday
          ? `本日、${format(dateObj, "M月d日", { locale: ja })}`
          : format(dateObj, "M月d日（E）", { locale: ja });

        return (
          <div
            key={date}
            className={cn("space-y-4", index > 0 && "opacity-80 hover:opacity-100 transition-opacity")}
          >
            {/* 日付ヘッダー */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                  {displayDate}
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {dateReports.length}件 / {photoCount}枚
                </span>
                {isPosted && (
                  <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                    投稿済み
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* CSVダウンロードボタン */}
                <button
                  onClick={(e) => handleDateCSVDownload(date, e)}
                  disabled={downloadingDate === date}
                  className="text-primary text-sm font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  {downloadingDate === date ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  CSVダウンロード
                </button>

                {/* 投稿済みトグル */}
                <Button
                  variant={isPosted ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "ml-2",
                    isPosted && "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={(e) => handleTogglePosted(date, e)}
                  disabled={isPending}
                >
                  {isPosted ? (
                    <>
                      <Check className="size-4 mr-1" />
                      投稿済み
                    </>
                  ) : (
                    <>
                      <Circle className="size-4 mr-1" />
                      未投稿
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* レポートカードグリッド */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dateReports.flatMap((report) =>
                report.photos.map((photo) => (
                  <ReportCard
                    key={photo.id}
                    photo={photo}
                    report={report}
                    onDownload={() => handleDownload(photo)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* 古いレポートを表示（将来実装） */}
      {groupedReports.length > 3 && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <button className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg group hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-4">
              <ChevronDown className="size-5 text-slate-400 group-hover:text-primary" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                さらに古いレポートを表示
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * レポートカード
 */
interface ReportCardProps {
  photo: Photo;
  report: Report;
  onDownload: () => void;
}

const ReportCard = ({
  photo,
  report,
  onDownload,
}: ReportCardProps) => {
  const time = format(new Date(report.createdAt), "HH:mm");

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* 画像 */}
      <div className="h-40 relative">
        <LazyImage
          src={photo.photoUrl}
          alt={photo.title}
          fill
          className="object-cover"
        />
        {/* 時刻バッジ */}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
          {time}
        </div>
        {/* ダウンロードボタン（ホバー時表示） */}
        <button
          onClick={onDownload}
          className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-700"
        >
          <Download className="size-4 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* コンテンツ */}
      <div className="p-3">
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
          {photo.title}
        </p>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <User className="size-3" />
          {report.user.name}
        </p>
      </div>
    </div>
  );
};
