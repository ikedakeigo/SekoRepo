/**
 * レポートフォームコンポーネント
 * 写真アップロードから送信までの一連の流れ
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { PhotoUploader } from "./photo-uploader";
import { PhotoDetailCard } from "./photo-detail-card";
import { ProjectSelector } from "./project-selector";
import { createReportWithUrls } from "@/actions/reports";
import { uploadPhotosClient, deleteUploadedPhotosClient } from "@/lib/supabase/storage.client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PhotoFormData } from "@/types";

interface Project {
  id: string;
  name: string;
  location?: string | null;
}

interface ReportFormProps {
  projects: Project[];
  userId: string;
}

/**
 * レポートフォーム
 */
export const ReportForm = ({ projects: initialProjects, userId }: ReportFormProps) => {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [projectId, setProjectId] = useState("");
  const [summary, setSummary] = useState("");
  const [photos, setPhotos] = useState<PhotoFormData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [errors, setErrors] = useState<{
    projectId?: string;
    summary?: string;
    photos?: string;
    photoErrors?: Record<number, { title?: string }>;
  }>({});

  const handleProjectCreated = useCallback((project: Project) => {
    setProjects((prev) => [project, ...prev]);
  }, []);

  // 案件選択時にエラーをクリア
  const handleProjectChange = useCallback((value: string) => {
    setProjectId(value);
    if (value) {
      setErrors((prev) => ({ ...prev, projectId: undefined }));
    }
  }, []);

  // 作業内容入力時にエラーをクリア
  const handleSummaryChange = useCallback((value: string) => {
    setSummary(value);
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, summary: undefined }));
    }
  }, []);

  const handlePhotoChange = useCallback(
    (index: number, data: PhotoFormData) => {
      setPhotos((prev) => prev.map((p, i) => (i === index ? data : p)));
      // タイトルが入力されたらそのエラーをクリア
      if (data.title.trim()) {
        setErrors((prev) => {
          const newPhotoErrors = { ...prev.photoErrors };
          delete newPhotoErrors[index];
          const hasRemainingErrors = Object.keys(newPhotoErrors).length > 0;
          return {
            ...prev,
            photoErrors: hasRemainingErrors ? newPhotoErrors : undefined,
            photos: hasRemainingErrors ? prev.photos : undefined,
          };
        });
      }
    },
    []
  );

  const handlePhotoRemove = useCallback((index: number) => {
    setPhotos((prev) => {
      const photoToRemove = prev[index];
      if (photoToRemove.previewUrl) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const photoErrors: Record<number, { title?: string }> = {};

    if (!projectId) {
      newErrors.projectId = "案件を選択してください";
    }

    if (photos.length === 0) {
      newErrors.photos = "写真を1枚以上選択してください";
    }

    // 各写真のバリデーション（タイトル必須）
    photos.forEach((photo, index) => {
      if (!photo.title.trim()) {
        photoErrors[index] = { title: "タイトルを入力してください" };
      }
    });

    if (Object.keys(photoErrors).length > 0) {
      newErrors.photos = "すべての写真にタイトルを入力してください";
      newErrors.photoErrors = photoErrors;
    }

    // 今日の作業について（必須）
    if (!summary.trim()) {
      newErrors.summary = "今日の作業についての入力は必須です";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("入力内容を確認してください");
      return;
    }

    setIsSubmitting(true);
    let uploadedPhotoUrls: string[] = [];

    try {
      // 1. 写真をSupabase Storageに直接アップロード
      const photoFiles = photos
        .map((photo) => photo.file)
        .filter((file): file is File => file !== undefined);

      setUploadProgress(`写真をアップロード中... (0/${photoFiles.length})`);

      uploadedPhotoUrls = await uploadPhotosClient(
        photoFiles,
        userId,
        (completed, total) => {
          setUploadProgress(`写真をアップロード中... (${completed}/${total})`);
        }
      );

      setUploadProgress("レポートを保存中...");

      // 2. レポートを作成（URLのみ送信）
      const photosWithUrls = photos.map((photo, index) => ({
        photoUrl: uploadedPhotoUrls[index],
        photoType: photo.photoType,
        title: photo.title,
        comment: photo.comment,
        customerFeedback: photo.customerFeedback,
      }));

      await createReportWithUrls({
        projectId,
        summary: summary.trim(),
        photos: photosWithUrls,
      });

      toast.success("レポートを送信しました");
      router.push("/?success=true");
    } catch {
      // エラー時はアップロード済みの写真を削除
      if (uploadedPhotoUrls.length > 0) {
        await deleteUploadedPhotosClient(uploadedPhotoUrls).catch(() => {
          // 削除失敗は無視（ゴミが残るだけなので）
        });
      }
      toast.error("送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-36">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 p-4 border-b bg-background sticky top-0 z-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">レポート送信</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* STEP 1: 写真選択 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">STEP 1: 写真を選択</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoUploader photos={photos} onChange={setPhotos} />
            {errors.photos && (
              <p className="text-sm text-red-500 mt-2">{errors.photos}</p>
            )}
          </CardContent>
        </Card>

        {/* STEP 2: 案件選択 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">STEP 2: 案件を選択</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectSelector
              projects={projects}
              value={projectId}
              onChange={handleProjectChange}
              onProjectCreated={handleProjectCreated}
              error={errors.projectId}
            />
          </CardContent>
        </Card>

        {/* 全体コメント */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              今日の作業について <span className="text-red-500">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="summary" className="text-sm text-muted-foreground">
                その日の作業内容、お客様の様子、現場での出来事など自由に記入してください
              </Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => handleSummaryChange(e.target.value)}
                placeholder="例: 今日は〇〇邸で屋根の葺き替え作業を行いました。朝は少し雨が降っていましたが、午後から晴れて作業がスムーズに進みました。お客様がお茶を差し入れてくださり、とても嬉しかったです。材料の運搬時に少し道が狭かったですが、無事に完了しました。"
                rows={5}
                maxLength={2000}
                className={cn("resize-none", errors.summary && "border-red-500 border-2")}
              />
              {errors.summary && (
                <p className="text-sm text-red-500">{errors.summary}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">
                {summary.length}/2000文字
              </p>
            </div>
          </CardContent>
        </Card>

        {/* STEP 3: 写真の詳細 */}
        {photos.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h2 className="text-base font-semibold px-1">
                STEP 3: 各写真の詳細
              </h2>
              {photos.map((photo, index) => (
                <PhotoDetailCard
                  key={index}
                  index={index}
                  total={photos.length}
                  data={photo}
                  onChange={(data) => handlePhotoChange(index, data)}
                  onRemove={() => handlePhotoRemove(index)}
                  errors={errors.photoErrors?.[index]}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 送信ボタン（モバイルナビの上に配置） */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t z-40 md:bottom-0">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting || photos.length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {uploadProgress || "送信中..."}
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              送信する
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
