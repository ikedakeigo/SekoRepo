/**
 * レポート詳細画面のメインコンテナ
 * 閲覧/編集モードの切替とフォーム送信を管理
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { PhotoViewCard } from "./photo-view-card";
import { PhotoEditCard } from "./photo-edit-card";
import { updateReportPhotos } from "@/actions/reports";
import { updatePhotoSchema } from "@/lib/validations/report";
import type { ReportDetail, PhotoEditData } from "@/types";

interface ReportDetailViewProps {
  report: ReportDetail;
}

/**
 * レポート詳細画面
 */
export const ReportDetailView = ({ report }: ReportDetailViewProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<PhotoEditData[]>(() =>
    report.photos.map((photo) => ({
      id: photo.id,
      photoUrl: photo.photoUrl,
      photoType: photo.photoType,
      title: photo.title,
      comment: photo.comment || "",
      customerFeedback: photo.customerFeedback || "",
    }))
  );
  const [errors, setErrors] = useState<
    Record<string, { title?: string; comment?: string; customerFeedback?: string }>
  >({});

  const handleBack = () => {
    router.back();
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setErrors({});
  };

  const handleCancelEdit = () => {
    // 元のデータに戻す
    setEditData(
      report.photos.map((photo) => ({
        id: photo.id,
        photoUrl: photo.photoUrl,
        photoType: photo.photoType,
        title: photo.title,
        comment: photo.comment || "",
        customerFeedback: photo.customerFeedback || "",
      }))
    );
    setIsEditing(false);
    setErrors({});
  };

  const handlePhotoChange = (index: number, data: PhotoEditData) => {
    setEditData((prev) => prev.map((p, i) => (i === index ? data : p)));
  };

  const handleSave = () => {
    // バリデーション
    const newErrors: Record<
      string,
      { title?: string; comment?: string; customerFeedback?: string }
    > = {};
    let hasError = false;

    editData.forEach((photo) => {
      const result = updatePhotoSchema.safeParse(photo);
      if (!result.success) {
        hasError = true;
        const fieldErrors: { title?: string; comment?: string; customerFeedback?: string } = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (field === "title" || field === "comment" || field === "customerFeedback") {
            fieldErrors[field] = issue.message;
          }
        });
        newErrors[photo.id] = fieldErrors;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      toast.error("入力内容を確認してください");
      return;
    }

    startTransition(async () => {
      try {
        await updateReportPhotos(
          report.id,
          editData.map((photo) => ({
            id: photo.id,
            title: photo.title,
            comment: photo.comment,
            customerFeedback: photo.customerFeedback,
          }))
        );
        toast.success("レポートを更新しました");
        setIsEditing(false);
        setErrors({});
        router.refresh();
      } catch {
        toast.error("更新に失敗しました");
      }
    });
  };

  return (
    <div className="min-h-screen pb-20">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              disabled={isPending}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">レポート詳細</h1>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
            >
              <Pencil className="h-4 w-4 mr-1" />
              編集する
            </Button>
          )}
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-1" />
              キャンセル
            </Button>
          )}
        </div>
      </div>

      {/* レポート情報 */}
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <h2 className="font-medium">{report.projectName}</h2>
          {report.projectLocation && (
            <p className="text-sm text-muted-foreground">
              {report.projectLocation}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {format(new Date(report.createdAt), "yyyy年M月d日 HH:mm", {
              locale: ja,
            })}
            {" • "}写真 {report.photos.length}枚
          </p>
        </div>

        {/* 写真一覧 */}
        <div className="space-y-4">
          {isEditing
            ? editData.map((photo, index) => (
                <PhotoEditCard
                  key={photo.id}
                  data={photo}
                  onChange={(data) => handlePhotoChange(index, data)}
                  index={index}
                  total={editData.length}
                  errors={errors[photo.id]}
                />
              ))
            : report.photos.map((photo, index) => (
                <PhotoViewCard
                  key={photo.id}
                  photoUrl={photo.photoUrl}
                  photoType={photo.photoType}
                  title={photo.title}
                  comment={photo.comment}
                  customerFeedback={photo.customerFeedback}
                  index={index}
                  total={report.photos.length}
                />
              ))}
        </div>
      </div>

      {/* 固定フッター（編集モード時のみ） */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "保存中..." : "保存する"}
          </Button>
        </div>
      )}
    </div>
  );
};
