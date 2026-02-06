/**
 * 写真アップロード管理カスタムフック
 * - サムネイル即時生成
 * - バックグラウンド圧縮
 * - 最大3枚同時並列アップロード（XHR進捗付き）
 * - 個別プログレス管理
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { compressImage, createThumbnail } from "@/lib/image-compression";
import { uploadPhotoWithProgress } from "@/lib/supabase/storage-xhr.client";
import { deleteUploadedPhotosClient } from "@/lib/supabase/storage.client";
import type {
  PhotoUploadItem,
  PhotoUploadStatus,
  PhotoFormData,
  PhotoType,
} from "@/types";

const CONCURRENT_LIMIT = 3;

interface UsePhotoUploadReturn {
  items: PhotoUploadItem[];
  addPhotos: (files: File[]) => Promise<void>;
  removePhoto: (id: string) => void;
  updatePhotoData: (id: string, data: Partial<PhotoFormData>) => void;
  uploadAll: (userId: string) => Promise<PhotoUploadItem[]>;
  overallProgress: number;
  isCompressing: boolean;
  isUploading: boolean;
  canSubmit: boolean;
  cleanupUploadedPhotos: () => Promise<void>;
}

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 写真アップロード管理フック
 */
export function usePhotoUpload(maxPhotos = 10): UsePhotoUploadReturn {
  const [items, setItems] = useState<PhotoUploadItem[]>([]);
  const itemsRef = useRef<PhotoUploadItem[]>([]);

  // アンマウント時にObject URLをクリーンアップ
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  // refとstateを同期
  const updateItems = useCallback(
    (updater: (prev: PhotoUploadItem[]) => PhotoUploadItem[]) => {
      setItems((prev) => {
        const next = updater(prev);
        itemsRef.current = next;
        return next;
      });
    },
    []
  );

  // 単一アイテムのステータスを更新
  const updateItemStatus = useCallback(
    (
      id: string,
      status: PhotoUploadStatus,
      progress: number,
      extra?: Partial<PhotoUploadItem>
    ) => {
      updateItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, uploadStatus: status, uploadProgress: progress, ...extra }
            : item
        )
      );
    },
    [updateItems]
  );

  /**
   * 写真を追加（サムネイル即時生成 + バックグラウンド圧縮）
   */
  const addPhotos = useCallback(
    async (files: File[]) => {
      const remaining = maxPhotos - itemsRef.current.length;
      const toAdd = files.slice(0, remaining);
      if (toAdd.length === 0) return;

      // 1. サムネイルを即時生成してUIに表示
      const newItems: PhotoUploadItem[] = await Promise.all(
        toAdd.map(async (file) => ({
          id: generateId(),
          file,
          previewUrl: "",
          thumbnailUrl: await createThumbnail(file),
          photoType: "during" as PhotoType,
          title: "",
          comment: "",
          customerFeedback: "",
          uploadStatus: "pending" as PhotoUploadStatus,
          uploadProgress: 0,
        }))
      );

      updateItems((prev) => [...prev, ...newItems]);

      // 2. バックグラウンドで圧縮
      for (const item of newItems) {
        updateItemStatus(item.id, "compressing", 0);

        const compressed = await compressImage(item.file!);
        const previewUrl = URL.createObjectURL(compressed);

        updateItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  file: compressed,
                  previewUrl,
                  uploadStatus: "ready" as PhotoUploadStatus,
                  uploadProgress: 0,
                }
              : p
          )
        );
      }
    },
    [maxPhotos, updateItems, updateItemStatus]
  );

  /**
   * 写真を削除
   */
  const removePhoto = useCallback(
    (id: string) => {
      updateItems((prev) => {
        const item = prev.find((p) => p.id === id);
        if (item) {
          if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        }
        return prev.filter((p) => p.id !== id);
      });
    },
    [updateItems]
  );

  /**
   * 写真のフォームデータを更新（タイトル、コメント等）
   */
  const updatePhotoData = useCallback(
    (id: string, data: Partial<PhotoFormData>) => {
      updateItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
    },
    [updateItems]
  );

  /**
   * 全写真をアップロード（最大3枚同時）
   */
  const uploadAll = useCallback(
    async (userId: string): Promise<PhotoUploadItem[]> => {
      const readyItems = itemsRef.current.filter(
        (item) => item.uploadStatus === "ready"
      );

      const executing = new Set<Promise<void>>();

      for (const item of readyItems) {
        const promise = (async () => {
          try {
            updateItemStatus(item.id, "uploading", 0);

            const fileToUpload = item.file;
            if (!fileToUpload) {
              throw new Error("ファイルが見つかりません");
            }

            const url = await uploadPhotoWithProgress(
              fileToUpload,
              userId,
              (percent) => {
                updateItemStatus(item.id, "uploading", percent);
              }
            );

            updateItemStatus(item.id, "completed", 100, { uploadedUrl: url });
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "アップロードに失敗しました";
            updateItemStatus(item.id, "error", 0, { error: message });
          }
        })();

        executing.add(promise);
        promise.then(() => executing.delete(promise));

        if (executing.size >= CONCURRENT_LIMIT) {
          await Promise.race(executing);
        }
      }

      await Promise.all(executing);

      return itemsRef.current;
    },
    [updateItemStatus]
  );

  /**
   * アップロード済みの写真をクリーンアップ（エラー時のロールバック用）
   */
  const cleanupUploadedPhotos = useCallback(async () => {
    const uploadedUrls = itemsRef.current
      .filter((item) => item.uploadedUrl)
      .map((item) => item.uploadedUrl!);

    if (uploadedUrls.length > 0) {
      await deleteUploadedPhotosClient(uploadedUrls).catch(() => {});
    }
  }, []);

  // 計算プロパティ
  const isCompressing = items.some(
    (item) => item.uploadStatus === "compressing"
  );
  const isUploading = items.some((item) => item.uploadStatus === "uploading");

  // アップロード中・完了・エラーの項目のみ進捗を計算
  const uploadRelevantItems = items.filter(
    (item) =>
      item.uploadStatus === "uploading" ||
      item.uploadStatus === "completed" ||
      item.uploadStatus === "error"
  );
  const overallProgress =
    uploadRelevantItems.length === 0
      ? 0
      : Math.round(
          uploadRelevantItems.reduce(
            (sum, item) => sum + item.uploadProgress,
            0
          ) / uploadRelevantItems.length
        );

  const canSubmit =
    items.length > 0 &&
    items.every(
      (item) =>
        item.uploadStatus === "ready" || item.uploadStatus === "completed"
    );

  return {
    items,
    addPhotos,
    removePhoto,
    updatePhotoData,
    uploadAll,
    overallProgress,
    isCompressing,
    isUploading,
    canSubmit,
    cleanupUploadedPhotos,
  };
}
