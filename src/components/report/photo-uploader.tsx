/**
 * 写真アップローダーコンポーネント
 * 複数の写真を選択してプレビュー表示
 */

"use client";

import { useRef, useCallback, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImages } from "@/lib/image-compression";
import type { PhotoFormData, PhotoType, PhotoUploadItem } from "@/types";

interface PhotoUploaderBaseProps {
  maxPhotos?: number;
}

/** レガシーモード: 内部で圧縮してPhotoFormData[]を返す */
interface PhotoUploaderLegacyProps extends PhotoUploaderBaseProps {
  photos: PhotoFormData[];
  onChange: (photos: PhotoFormData[]) => void;
  onFilesAdded?: never;
  uploadItems?: never;
  onRemoveUploadItem?: never;
}

/** 新モード: 生ファイルを外部に渡す（usePhotoUploadフック連携） */
interface PhotoUploaderNewProps extends PhotoUploaderBaseProps {
  photos?: never;
  onChange?: never;
  onFilesAdded: (files: File[]) => void;
  uploadItems: PhotoUploadItem[];
  onRemoveUploadItem: (id: string) => void;
}

type PhotoUploaderProps = PhotoUploaderLegacyProps | PhotoUploaderNewProps;

/** デフォルトの写真データ */
const createDefaultPhotoData = (
  file: File,
  previewUrl: string
): PhotoFormData => ({
  file,
  previewUrl,
  photoType: "during" as PhotoType,
  title: "",
  comment: "",
  customerFeedback: "",
});

/**
 * 写真アップローダー
 */
export const PhotoUploader = (props: PhotoUploaderProps) => {
  const { maxPhotos = 10 } = props;
  const isNewMode = "onFilesAdded" in props && !!props.onFilesAdded;

  const inputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const photoCount = isNewMode ? props.uploadItems.length : props.photos.length;

  const handleFileChange = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const remainingSlots = maxPhotos - photoCount;
      const filesToAdd = Array.from(files).slice(0, remainingSlots);

      if (filesToAdd.length === 0) return;

      if (isNewMode) {
        // 新モード: 生ファイルを外部に渡す
        props.onFilesAdded(filesToAdd);
      } else {
        // レガシーモード: 内部で圧縮
        setIsCompressing(true);
        try {
          const compressedFiles = await compressImages(filesToAdd);
          const newPhotos = compressedFiles.map((file) => {
            const previewUrl = URL.createObjectURL(file);
            return createDefaultPhotoData(file, previewUrl);
          });
          props.onChange([...props.photos, ...newPhotos]);
        } finally {
          setIsCompressing(false);
        }
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [maxPhotos, photoCount, isNewMode, props]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChange(e.target.files);
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileChange(e.dataTransfer.files);
    },
    [handleFileChange]
  );

  const handleRemove = useCallback(
    (index: number) => {
      if (isNewMode) {
        const item = props.uploadItems[index];
        if (item) {
          props.onRemoveUploadItem(item.id);
        }
      } else {
        const photoToRemove = props.photos[index];
        if (photoToRemove.previewUrl) {
          URL.revokeObjectURL(photoToRemove.previewUrl);
        }
        const newPhotos = props.photos.filter((_, i) => i !== index);
        props.onChange(newPhotos);
      }
    },
    [isNewMode, props]
  );

  const canAddMore = photoCount < maxPhotos;

  // プレビュー用のデータ
  const previewItems = isNewMode
    ? props.uploadItems.map((item) => ({
        key: item.id,
        previewUrl: item.previewUrl || item.thumbnailUrl,
        isCompressing: item.uploadStatus === "compressing",
      }))
    : props.photos.map((photo, i) => ({
        key: String(i),
        previewUrl: photo.previewUrl,
        isCompressing: false,
      }));

  const showCompressingState = isNewMode
    ? props.uploadItems.some((item) => item.uploadStatus === "compressing")
    : isCompressing;

  return (
    <div className="space-y-4">
      {/* ドロップゾーン */}
      <div
        onClick={() => canAddMore && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center bg-white/50 dark:bg-slate-900/50 transition-colors cursor-pointer group",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-slate-300 dark:border-slate-700 hover:border-primary",
          !canAddMore && "opacity-50 cursor-not-allowed"
        )}
      >
        <div
          className={cn(
            "size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors",
            "group-hover:bg-primary/10 group-hover:text-primary"
          )}
        >
          {showCompressingState ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            <Upload className="size-8" />
          )}
        </div>
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          {showCompressingState
            ? "画像を圧縮中..."
            : "クリックしてアップロード、またはドラッグ＆ドロップ"}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          高解像度のJPGまたはPNG（最大10MBまで）
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          {photoCount}/{maxPhotos}枚選択中
        </p>
      </div>

      {/* 選択済み写真のプレビュー */}
      {previewItems.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {previewItems.map((item, index) => (
            <div key={item.key} className="relative aspect-square">
              {item.previewUrl ? (
                <Image
                  src={item.previewUrl}
                  alt={`写真 ${index + 1}`}
                  fill
                  className={cn(
                    "object-cover rounded-lg",
                    item.isCompressing && "opacity-50"
                  )}
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
};
