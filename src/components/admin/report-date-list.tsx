/**
 * 日付別レポートリストコンポーネント
 * 日付ごとにグループ化されたレポートをグリッド表示
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LazyImage } from "@/components/shared";
import {
  ChevronDown,
  User,
  Download,
  Check,
  Circle,
  Loader2,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toggleDatePostedStatus } from "@/actions/projects";
import { deleteReport, deleteSinglePhoto } from "@/actions/reports";
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
  const router = useRouter();
  const [localPostedDates, setLocalPostedDates] = useState<Set<string>>(
    new Set(postedDates)
  );
  const [localReports, setLocalReports] = useState<Report[]>(reports);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [downloadingDate, setDownloadingDate] = useState<string | null>(null);

  // サーバー再レンダー時にpropsと同期
  useEffect(() => {
    setLocalReports(reports);
  }, [reports]);

  useEffect(() => {
    setLocalPostedDates(new Set(postedDates));
  }, [postedDates]);

  const groupedReports = groupReportsByDate(localReports);

  const handleTogglePosted = (date: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const previousDates = new Set(localPostedDates);

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
      try {
        await toggleDatePostedStatus(projectId, date);
      } catch (error) {
        setLocalPostedDates(previousDates);
        toast.error("ステータスの更新に失敗しました");
        console.error("Toggle posted failed:", error);
      }
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

  const handleDeletePhoto = (photoId: string) => {
    const previousReports = localReports;
    setDeletingPhotoId(photoId);

    // 楽観的更新: 写真をレポートから除去、写真が0枚になったレポートも除去
    setLocalReports((prev) =>
      prev
        .map((r) => ({
          ...r,
          photos: r.photos.filter((p) => p.id !== photoId),
        }))
        .filter((r) => r.photos.length > 0)
    );

    startTransition(async () => {
      try {
        await deleteSinglePhoto(photoId);
        toast.success("写真を削除しました");
      } catch (error) {
        setLocalReports(previousReports);
        toast.error("削除に失敗しました");
        console.error("Delete photo failed:", error);
      } finally {
        setDeletingPhotoId(null);
      }
    });
  };

  const handleDeleteDateReports = (dateReports: Report[]) => {
    const reportIds = dateReports.map((r) => r.id);

    // 楽観的更新: UIから即座に除去
    setLocalReports((prev) => prev.filter((r) => !reportIds.includes(r.id)));

    startTransition(async () => {
      const results = await Promise.allSettled(
        reportIds.map((id) => deleteReport(id))
      );
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        // 部分失敗: サーバーの実際の状態に同期
        router.refresh();
        toast.error(`${failed.length}件の削除に失敗しました`);
      } else {
        toast.success(`${dateReports.length}件のレポートを削除しました`);
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

                {/* 日付ごと一括削除 */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4 mr-1" />
                      削除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {displayDate}のレポートを全て削除しますか？
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {dateReports.length}件のレポート（{photoCount}枚の写真）が削除されます。
                        この操作は元に戻せません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteDateReports(dateReports)}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        全て削除する
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* 投稿済みトグル */}
                <Button
                  variant={isPosted ? "default" : "outline"}
                  size="sm"
                  className={cn(
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
                    onDeletePhoto={() => handleDeletePhoto(photo.id)}
                    isDeleting={deletingPhotoId === photo.id}
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
  onDeletePhoto: () => void;
  isDeleting: boolean;
}

const ReportCard = ({
  photo,
  report,
  onDownload,
  onDeletePhoto,
  isDeleting,
}: ReportCardProps) => {
  const time = format(new Date(report.createdAt), "HH:mm");

  return (
    <div
      className={cn(
        "group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
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
        {/* アクションボタン（ホバー時表示） */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">
                <Trash2 className="size-4 text-red-500" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>この写真を削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  「{photo.title}」を削除します。
                  この操作は元に戻せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeletePhoto}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button
            onClick={onDownload}
            className="bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700"
          >
            <Download className="size-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
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
