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
import { createReport } from "@/actions/reports";
import { toast } from "sonner";
import type { PhotoFormData, PhotoType } from "@/types";

interface Project {
  id: string;
  name: string;
  location?: string | null;
}

interface ReportFormProps {
  projects: Project[];
}

/**
 * レポートフォーム
 */
export const ReportForm = ({ projects: initialProjects }: ReportFormProps) => {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [projectId, setProjectId] = useState("");
  const [summary, setSummary] = useState("");
  const [photos, setPhotos] = useState<PhotoFormData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    projectId?: string;
    summary?: string;
    photos?: string;
  }>({});

  const handleProjectCreated = useCallback((project: Project) => {
    setProjects((prev) => [project, ...prev]);
  }, []);

  const handlePhotoChange = useCallback(
    (index: number, data: PhotoFormData) => {
      setPhotos((prev) => prev.map((p, i) => (i === index ? data : p)));
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

    if (!projectId) {
      newErrors.projectId = "案件を選択してください";
    }

    if (photos.length === 0) {
      newErrors.photos = "写真を1枚以上選択してください";
    }

    // 各写真のバリデーション
    const hasInvalidTitle = photos.some((photo) => !photo.title.trim());
    if (hasInvalidTitle) {
      newErrors.photos = "すべての写真にタイトルを入力してください";
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

    try {
      // FormDataを作成（File オブジェクトの送信にはFormDataが必要）
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("summary", summary.trim());

      // 写真データをJSON化（ファイル以外のメタデータ）
      const photosMetadata = photos.map((photo) => ({
        photoType: photo.photoType,
        title: photo.title,
        comment: photo.comment,
        customerFeedback: photo.customerFeedback,
      }));
      formData.append("photosMetadata", JSON.stringify(photosMetadata));

      // 写真ファイルを追加
      photos.forEach((photo, index) => {
        if (photo.file) {
          formData.append(`photo_${index}`, photo.file);
        }
      });

      await createReport(formData);

      toast.success("レポートを送信しました");
      router.push("/?success=true");
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast.error("送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
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
              onChange={setProjectId}
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
                onChange={(e) => setSummary(e.target.value)}
                placeholder="例: 今日は〇〇邸で屋根の葺き替え作業を行いました。朝は少し雨が降っていましたが、午後から晴れて作業がスムーズに進みました。お客様がお茶を差し入れてくださり、とても嬉しかったです。材料の運搬時に少し道が狭かったですが、無事に完了しました。"
                rows={5}
                maxLength={2000}
                className="resize-none"
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
              送信中...
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
