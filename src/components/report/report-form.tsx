/**
 * レポートフォームコンポーネント
 * 写真アップロードから送信までの一連の流れ
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Building2, Camera, Info, ChevronRight, CheckCircle } from "lucide-react";
import { PhotoUploader } from "./photo-uploader";
import { PhotoDetailCard } from "./photo-detail-card";
import { PhotoUploadProgress } from "./photo-upload-progress";
import { ProjectSelector } from "./project-selector";
import { StepIndicator } from "./step-indicator";
import { createReportWithUrls } from "@/actions/reports";
import { usePhotoUpload } from "@/hooks/use-photo-upload";
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
export const ReportForm = ({
  projects: initialProjects,
  userId,
}: ReportFormProps) => {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [projectId, setProjectId] = useState("");
  const [summary, setSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<
    "idle" | "compressing" | "uploading" | "saving" | "success"
  >("idle");
  const [errors, setErrors] = useState<{
    projectId?: string;
    summary?: string;
    photos?: string;
    photoErrors?: Record<number, { title?: string }>;
  }>({});

  // 写真アップロード管理フック
  const {
    items: photoItems,
    addPhotos,
    removePhoto,
    updatePhotoData,
    uploadAll,
    overallProgress,
    isCompressing,
    isUploading,
    cleanupUploadedPhotos,
  } = usePhotoUpload();

  // ステップの状態を計算
  const steps = useMemo(
    () => [
      {
        number: 1,
        label: "案件",
        completed: !!projectId,
        active: !projectId,
      },
      {
        number: 2,
        label: "アップロード",
        completed: photoItems.length > 0,
        active: !!projectId && photoItems.length === 0,
      },
      {
        number: 3,
        label: "確認",
        completed: false,
        active: photoItems.length > 0,
      },
    ],
    [projectId, photoItems.length]
  );

  const handleProjectCreated = useCallback((project: Project) => {
    setProjects((prev) => [project, ...prev]);
  }, []);

  const handleProjectChange = useCallback((value: string) => {
    setProjectId(value);
    if (value) {
      setErrors((prev) => ({ ...prev, projectId: undefined }));
    }
  }, []);

  const handleSummaryChange = useCallback((value: string) => {
    setSummary(value);
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, summary: undefined }));
    }
  }, []);

  const handlePhotoChange = useCallback(
    (itemId: string, index: number, data: PhotoFormData) => {
      updatePhotoData(itemId, {
        photoType: data.photoType,
        title: data.title,
        comment: data.comment,
        customerFeedback: data.customerFeedback,
      });

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
    [updatePhotoData]
  );

  const handlePhotoRemove = useCallback(
    (itemId: string) => {
      removePhoto(itemId);
    },
    [removePhoto]
  );

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const photoErrors: Record<number, { title?: string }> = {};

    if (!projectId) {
      newErrors.projectId = "案件を選択してください";
    }

    if (photoItems.length === 0) {
      newErrors.photos = "写真を1枚以上選択してください";
    }

    photoItems.forEach((item, index) => {
      if (!item.title.trim()) {
        photoErrors[index] = { title: "タイトルを入力してください" };
      }
    });

    if (Object.keys(photoErrors).length > 0) {
      newErrors.photos = "すべての写真にタイトルを入力してください";
      newErrors.photoErrors = photoErrors;
    }

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
    setSubmitPhase("compressing");

    try {
      // XHRアップロード（個別進捗追跡付き）
      setSubmitPhase("uploading");
      const uploadedItems = await uploadAll(userId);

      // エラーがあるか確認
      const errorItems = uploadedItems.filter(
        (item) => item.uploadStatus === "error"
      );
      if (errorItems.length > 0) {
        throw new Error(
          `${errorItems.length}枚の写真のアップロードに失敗しました`
        );
      }

      // DB保存
      setSubmitPhase("saving");
      const photosWithUrls = uploadedItems.map((item) => ({
        photoUrl: item.uploadedUrl!,
        photoType: item.photoType,
        title: item.title,
        comment: item.comment,
        customerFeedback: item.customerFeedback,
      }));

      await createReportWithUrls({
        projectId,
        summary: summary.trim(),
        photos: photosWithUrls,
      });

      // 成功表示
      setSubmitPhase("success");
      toast.success("レポートを送信しました");
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/?success=true");
    } catch {
      await cleanupUploadedPhotos();
      toast.error("送信に失敗しました。もう一度お試しください。");
      setIsSubmitting(false);
      setSubmitPhase("idle");
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);
  const isFormDisabled = isSubmitting || isUploading;

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-background">
      {/* ヘッダー */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 sticky top-0 z-10">
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
          <Link href="/" className="hover:text-primary transition-colors">
            ホーム
          </Link>
          <ChevronRight className="size-4" />
          <span className="text-slate-900 dark:text-white">新規送信</span>
        </nav>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          新規レポート送信
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          現場の写真と詳細を記録します
        </p>
      </div>

      <div className="max-w-[800px] mx-auto w-full p-4 md:py-10">
        {/* ステップインジケーター */}
        <StepIndicator steps={steps} />

        <div className="space-y-12 pb-48 md:pb-32">
          {/* Step 1: 案件選択 */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="size-5 text-primary" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                Step 1: 案件選択
              </h2>
            </div>
            <ProjectSelector
              projects={projects}
              value={projectId}
              onChange={handleProjectChange}
              onProjectCreated={handleProjectCreated}
              error={errors.projectId}
            />
            {selectedProject && (
              <div className="mt-2 p-3 bg-primary/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-green-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    選択中: {selectedProject.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setProjectId("")}
                  className="text-primary text-sm font-bold hover:underline"
                  disabled={isFormDisabled}
                >
                  変更
                </button>
              </div>
            )}
          </section>

          {/* Step 2: 写真アップロード */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Camera className="size-5 text-primary" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                Step 2: 写真アップロード
              </h2>
            </div>
            {isSubmitting && photoItems.length > 0 && (
              <PhotoUploadProgress
                items={photoItems}
                overallProgress={overallProgress}
              />
            )}
            <div className={cn(isSubmitting && "opacity-50 pointer-events-none")}>
              <PhotoUploader
                onFilesAdded={addPhotos}
                uploadItems={photoItems}
                onRemoveUploadItem={removePhoto}
              />
            </div>
            {errors.photos && (
              <p className="text-sm text-red-500 mt-2">{errors.photos}</p>
            )}
          </section>

          {/* 写真詳細カード */}
          {photoItems.length > 0 && (
            <div className={cn("space-y-6", isSubmitting && "opacity-50 pointer-events-none")}>
              {photoItems.map((item, index) => (
                <PhotoDetailCard
                  key={item.id}
                  index={index}
                  total={photoItems.length}
                  data={{
                    file: item.file,
                    previewUrl: item.previewUrl || item.thumbnailUrl,
                    photoType: item.photoType,
                    title: item.title,
                    comment: item.comment,
                    customerFeedback: item.customerFeedback,
                  }}
                  onChange={(data) => handlePhotoChange(item.id, index, data)}
                  onRemove={() => handlePhotoRemove(item.id)}
                  errors={errors.photoErrors?.[index]}
                />
              ))}
            </div>
          )}

          {/* 今日の作業について */}
          <section>
            <div className="space-y-2">
              <Label
                htmlFor="summary"
                className="text-xl font-bold text-slate-900 dark:text-white"
              >
                今日の作業について <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                その日の作業内容、お客様の様子、現場での出来事など自由に記入してください
              </p>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => handleSummaryChange(e.target.value)}
                placeholder="例: 今日は〇〇邸で屋根の葺き替え作業を行いました。朝は少し雨が降っていましたが、午後から晴れて作業がスムーズに進みました。"
                rows={5}
                maxLength={2000}
                disabled={isFormDisabled}
                className={cn(
                  "resize-none rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900",
                  errors.summary && "border-red-500 border-2"
                )}
              />
              {errors.summary && (
                <p className="text-sm text-red-500">{errors.summary}</p>
              )}
              <p className="text-xs text-slate-400 text-right">
                {summary.length}/2000文字
              </p>
            </div>
          </section>

          {/* サマリーノート */}
          {photoItems.length > 0 && projectId && (
            <section className="bg-primary/5 rounded-xl p-6 border border-primary/20">
              <div className="flex items-start gap-3">
                <Info className="size-5 text-primary mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    レポートサマリー
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {photoItems.length}枚の写真を
                    <span className="font-semibold">
                      {selectedProject?.name}
                    </span>
                    に送信します。写真のメタデータに基づいて自動的にタイムスタンプが付与されます。
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* 固定ボタンバー */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-[800px] mx-auto flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 rounded-lg border-slate-200 dark:border-slate-700"
            onClick={() => router.back()}
            disabled={isFormDisabled}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            className={cn(
              "flex-2 h-12 rounded-lg text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-colors",
              submitPhase === "success"
                ? "bg-green-500 shadow-green-500/25"
                : "bg-primary hover:bg-primary/90 shadow-primary/25"
            )}
            disabled={isFormDisabled || photoItems.length === 0 || isCompressing}
          >
            {submitPhase === "success" ? (
              <>
                <CheckCircle className="size-5" />
                送信完了
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {submitPhase === "compressing"
                  ? "画像を圧縮中..."
                  : submitPhase === "uploading"
                    ? `アップロード中... ${overallProgress}%`
                    : "保存中..."}
              </>
            ) : (
              <>
                <Send className="size-5" />
                送信する
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
