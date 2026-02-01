/**
 * 日付別レポートリストコンポーネント
 * 日付ごとにグループ化されたレポートを表示
 */

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Camera, User, Download, MessageSquare, Check, Circle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { PHOTO_TYPE_LABELS } from "@/types";
import type { PhotoType } from "@/types";
import { cn } from "@/lib/utils";
import { toggleDatePostedStatus } from "@/actions/projects";
import { deleteReport } from "@/actions/reports";
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
  reports: Report[];
  postedDates: string[]; // YYYY-MM-DD形式の配列
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

  // 日付の降順でソート
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
export const ReportDateList = ({ projectId, reports, postedDates }: ReportDateListProps) => {
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [localPostedDates, setLocalPostedDates] = useState<Set<string>>(
    new Set(postedDates)
  );
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [localReports, setLocalReports] = useState<Report[]>(reports);

  const groupedReports = groupReportsByDate(localReports);

  const toggleDate = (date: string) => {
    setOpenDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleTogglePosted = (date: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Collapsibleのトリガーを防ぐ

    // 楽観的更新
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

    // 楽観的更新：ローカルからレポートを削除
    setLocalReports((prev) => prev.filter((r) => r.id !== reportId));

    startTransition(async () => {
      try {
        await deleteReport(reportId);
        toast.success("レポートを削除しました");
      } catch (error) {
        // 失敗した場合は元に戻す
        setLocalReports(reports);
        toast.error("削除に失敗しました");
        console.error("Delete failed:", error);
      } finally {
        setDeletingReportId(null);
      }
    });
  };

  if (localReports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        まだレポートがありません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groupedReports.map(({ date, reports: dateReports, photoCount }) => {
        const isOpen = openDates.has(date);
        const isPosted = localPostedDates.has(date);
        const displayDate = format(new Date(date), "M月d日（E）", { locale: ja });

        return (
          <Collapsible key={date} open={isOpen} onOpenChange={() => toggleDate(date)}>
            <Card className={cn(isPosted && "border-green-300 bg-green-50/50")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-3 text-left flex-1">
                      <ChevronRight
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform",
                          isOpen && "rotate-90"
                        )}
                      />
                      <span className="font-medium">{displayDate}</span>
                      <Badge variant="secondary" className="font-normal">
                        <Camera className="h-3 w-3 mr-1" />
                        {photoCount}枚
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {dateReports.length}件
                      </span>
                    </button>
                  </CollapsibleTrigger>

                  {/* 投稿済みボタン */}
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
                        <Check className="h-4 w-4 mr-1" />
                        投稿済み
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 mr-1" />
                        未投稿
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>

              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4">
                  {dateReports.map((report) => (
                    <div
                      key={report.id}
                      className="border rounded-lg p-4 space-y-3 bg-background"
                    >
                      {/* レポートヘッダー */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{report.user.name}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(report.createdAt), "HH:mm", {
                              locale: ja,
                            })}
                          </span>
                          <span>•</span>
                          <span>{report.photos.length}枚</span>
                        </div>

                        {/* 削除ボタン */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                              disabled={deletingReportId === report.id || isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>レポートを削除</AlertDialogTitle>
                              <AlertDialogDescription>
                                このレポートと{report.photos.length}枚の写真を削除します。
                                この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReport(report.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                削除する
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* 全体コメント */}
                      {report.summary && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-600 font-medium mb-1">
                            今日の作業について
                          </p>
                          <p className="text-sm text-blue-900 whitespace-pre-wrap">
                            {report.summary}
                          </p>
                        </div>
                      )}

                      {/* 写真一覧 */}
                      <div className="space-y-3">
                        {report.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="flex gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            {/* サムネイル */}
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                              <Image
                                src={photo.photoUrl}
                                alt={photo.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>

                            {/* 情報 */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {PHOTO_TYPE_LABELS[photo.photoType as PhotoType]}
                                </Badge>
                                <span className="font-medium text-sm truncate">
                                  {photo.title}
                                </span>
                              </div>

                              {photo.comment && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {photo.comment}
                                </p>
                              )}

                              {photo.customerFeedback && (
                                <div className="flex items-start gap-1.5 text-xs">
                                  <MessageSquare className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                                  <span className="text-green-700 line-clamp-1">
                                    {photo.customerFeedback}
                                  </span>
                                </div>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleDownload(photo)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                ダウンロード
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};
