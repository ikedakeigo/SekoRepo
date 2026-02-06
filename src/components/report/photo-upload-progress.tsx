/**
 * 写真アップロード進捗表示コンポーネント
 * 全体プログレスバー + 各写真の個別ステータス
 */

"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Loader2, ImageIcon } from "lucide-react";
import type { PhotoUploadItem, PhotoUploadStatus } from "@/types";

interface PhotoUploadProgressProps {
  items: PhotoUploadItem[];
  overallProgress: number;
}

/**
 * アップロード進捗表示
 */
export function PhotoUploadProgress({
  items,
  overallProgress,
}: PhotoUploadProgressProps) {
  if (items.length === 0) return null;

  const completedCount = items.filter(
    (item) => item.uploadStatus === "completed"
  ).length;
  const hasError = items.some((item) => item.uploadStatus === "error");
  const isUploading = items.some(
    (item) =>
      item.uploadStatus === "uploading" ||
      item.uploadStatus === "compressing"
  );

  return (
    <div className="space-y-4">
      {/* 全体プログレス */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {hasError
              ? "一部のアップロードに失敗しました"
              : isUploading
                ? `アップロード中... ${completedCount}/${items.length}枚`
                : `${completedCount}/${items.length}枚 完了`}
          </span>
          <span className="font-medium">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* 各写真の進捗 */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="relative rounded-lg border overflow-hidden"
          >
            {/* サムネイル */}
            <div className="aspect-square relative">
              <img
                src={item.thumbnailUrl || item.previewUrl}
                alt={`写真${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* ステータスオーバーレイ */}
              {item.uploadStatus !== "ready" &&
                item.uploadStatus !== "pending" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <StatusIcon status={item.uploadStatus} />
                  </div>
                )}
            </div>

            {/* 個別プログレスバー */}
            {(item.uploadStatus === "compressing" ||
              item.uploadStatus === "uploading") && (
              <Progress
                value={item.uploadProgress}
                className="h-1 absolute bottom-0 left-0 right-0 rounded-none"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: PhotoUploadStatus }) {
  switch (status) {
    case "pending":
    case "ready":
      return null;
    case "compressing":
      return (
        <div className="bg-black/50 rounded-full p-2">
          <ImageIcon className="w-5 h-5 text-white animate-pulse" />
        </div>
      );
    case "uploading":
      return (
        <div className="bg-black/50 rounded-full p-2">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      );
    case "completed":
      return (
        <div className="bg-green-500/80 rounded-full p-2">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
      );
    case "error":
      return (
        <div className="bg-red-500/80 rounded-full p-2">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
      );
  }
}
