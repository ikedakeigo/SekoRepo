/**
 * レポート詳細画面のメインコンテナ
 * 閲覧/編集モードの切替とフォーム送信を管理
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { PhotoViewCard } from "./photo-view-card";
import { PhotoEditCard } from "./photo-edit-card";
import { PhotoUploader } from "@/components/report/photo-uploader";
import { PhotoDetailCard } from "@/components/report/photo-detail-card";
import { updateReportPhotos, addPhotosToReport, updateReportSummary } from "@/actions/reports";
import { updatePhotoSchema, photoFormSchema } from "@/lib/validations/report";
import type { ReportDetail, PhotoEditData, PhotoFormData } from "@/types";

interface ReportDetailViewProps {
  report: ReportDetail;
}

const MAX_TOTAL_PHOTOS = 10;

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
  const [newPhotos, setNewPhotos] = useState<PhotoFormData[]>([]);
  const [editSummary, setEditSummary] = useState(report.summary || "");
  const [errors, setErrors] = useState<
    Record<string, { title?: string; comment?: string; customerFeedback?: string }>
  >({});
  const [newPhotoErrors, setNewPhotoErrors] = useState<
    Record<number, { photoType?: string; title?: string; comment?: string; customerFeedback?: string }>
  >({});

  const handleBack = () => {
    router.back();
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setErrors({});
    setNewPhotoErrors({});
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
    // 新しい写真のプレビューURLを解放
    newPhotos.forEach((photo) => {
      if (photo.previewUrl) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    });
    setNewPhotos([]);
    setEditSummary(report.summary || "");
    setIsEditing(false);
    setErrors({});
    setNewPhotoErrors({});
  };

  const handlePhotoChange = (index: number, data: PhotoEditData) => {
    setEditData((prev) => prev.map((p, i) => (i === index ? data : p)));
  };

  const handleNewPhotosChange = (photos: PhotoFormData[]) => {
    setNewPhotos(photos);
  };

  const handleNewPhotoChange = (index: number, data: PhotoFormData) => {
    setNewPhotos((prev) => prev.map((p, i) => (i === index ? data : p)));
  };

  const handleNewPhotoRemove = (index: number) => {
    const photoToRemove = newPhotos[index];
    if (photoToRemove.previewUrl) {
      URL.revokeObjectURL(photoToRemove.previewUrl);
    }
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // 既存写真のバリデーション
    const existingErrors: Record<
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
        existingErrors[photo.id] = fieldErrors;
      }
    });

    // 新規写真のバリデーション
    const newErrors: Record<
      number,
      { photoType?: string; title?: string; comment?: string; customerFeedback?: string }
    > = {};

    newPhotos.forEach((photo, index) => {
      const result = photoFormSchema.safeParse(photo);
      if (!result.success) {
        hasError = true;
        const fieldErrors: { photoType?: string; title?: string; comment?: string; customerFeedback?: string } = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (field === "photoType" || field === "title" || field === "comment" || field === "customerFeedback") {
            fieldErrors[field] = issue.message;
          }
        });
        newErrors[index] = fieldErrors;
      }
    });

    if (hasError) {
      setErrors(existingErrors);
      setNewPhotoErrors(newErrors);
      toast.error("入力内容を確認してください");
      return;
    }

    startTransition(async () => {
      try {
        // 既存写真の更新
        await updateReportPhotos(
          report.id,
          editData.map((photo) => ({
            id: photo.id,
            title: photo.title,
            comment: photo.comment,
            customerFeedback: photo.customerFeedback,
          }))
        );

        // 新規写真の追加
        if (newPhotos.length > 0) {
          const formData = new FormData();
          formData.append("reportId", report.id);

          // 写真メタデータをJSON化
          const photosMetadata = newPhotos.map((photo) => ({
            photoType: photo.photoType,
            title: photo.title,
            comment: photo.comment,
            customerFeedback: photo.customerFeedback,
          }));
          formData.append("photosMetadata", JSON.stringify(photosMetadata));

          // 写真ファイルを追加
          newPhotos.forEach((photo, index) => {
            if (photo.file) {
              formData.append(`photo_${index}`, photo.file);
            }
          });

          await addPhotosToReport(formData);
        }

        // 全体コメントの更新（変更があった場合のみ）
        if (editSummary !== (report.summary || "")) {
          await updateReportSummary(report.id, editSummary);
        }

        toast.success("レポートを更新しました");
        setIsEditing(false);
        setErrors({});
        setNewPhotoErrors({});
        setNewPhotos([]);
        router.refresh();
      } catch {
        toast.error("更新に失敗しました");
      }
    });
  };

  const remainingSlots = MAX_TOTAL_PHOTOS - editData.length - newPhotos.length;
  const canAddMorePhotos = remainingSlots > 0;

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
            {" • "}写真 {editData.length + newPhotos.length}枚
          </p>
        </div>

        {/* 全体コメント */}
        {isEditing ? (
          <Card>
            <CardContent className="p-4 space-y-2">
              <Label htmlFor="edit-summary" className="font-medium">
                今日の作業について
              </Label>
              <p className="text-xs text-muted-foreground">
                その日の作業内容、お客様の様子、現場での出来事など
              </p>
              <Textarea
                id="edit-summary"
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                placeholder="例: 今日は〇〇邸で屋根の葺き替え作業を行いました..."
                rows={4}
                maxLength={2000}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {editSummary.length}/2000文字
              </p>
            </CardContent>
          </Card>
        ) : report.summary ? (
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                今日の作業について
              </p>
              <p className="text-sm whitespace-pre-wrap">{report.summary}</p>
            </CardContent>
          </Card>
        ) : null}

        {/* 既存写真一覧 */}
        <div className="space-y-4">
          {isEditing
            ? editData.map((photo, index) => (
                <PhotoEditCard
                  key={photo.id}
                  data={photo}
                  onChange={(data) => handlePhotoChange(index, data)}
                  index={index}
                  total={editData.length + newPhotos.length}
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

        {/* 新規写真追加（編集モード時のみ） */}
        {isEditing && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">写真を追加</h3>

            {/* 新規写真のプレビュー・詳細入力 */}
            {newPhotos.map((photo, index) => (
              <PhotoDetailCard
                key={`new-${index}`}
                index={editData.length + index}
                total={editData.length + newPhotos.length}
                data={photo}
                onChange={(data) => handleNewPhotoChange(index, data)}
                onRemove={() => handleNewPhotoRemove(index)}
                errors={newPhotoErrors[index]}
              />
            ))}

            {/* 写真アップローダー */}
            {canAddMorePhotos && (
              <PhotoUploader
                photos={newPhotos}
                onChange={handleNewPhotosChange}
                maxPhotos={remainingSlots + newPhotos.length}
              />
            )}

            {!canAddMorePhotos && (
              <p className="text-sm text-muted-foreground text-center py-2">
                写真は最大{MAX_TOTAL_PHOTOS}枚までです
              </p>
            )}
          </div>
        )}
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
