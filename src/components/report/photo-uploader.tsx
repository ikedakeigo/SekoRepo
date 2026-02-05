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
import type { PhotoFormData, PhotoType } from "@/types";

interface PhotoUploaderProps {
  photos: PhotoFormData[];
  onChange: (photos: PhotoFormData[]) => void;
  maxPhotos?: number;
}

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
export const PhotoUploader = ({
  photos,
  onChange,
  maxPhotos = 10,
}: PhotoUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const remainingSlots = maxPhotos - photos.length;
      const filesToAdd = Array.from(files).slice(0, remainingSlots);

      setIsCompressing(true);
      try {
        const compressedFiles = await compressImages(filesToAdd);

        const newPhotos = compressedFiles.map((file) => {
          const previewUrl = URL.createObjectURL(file);
          return createDefaultPhotoData(file, previewUrl);
        });

        onChange([...photos, ...newPhotos]);
      } finally {
        setIsCompressing(false);
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [photos, onChange, maxPhotos]
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
      const photoToRemove = photos[index];
      if (photoToRemove.previewUrl) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }
      const newPhotos = photos.filter((_, i) => i !== index);
      onChange(newPhotos);
    },
    [photos, onChange]
  );

  const canAddMore = photos.length < maxPhotos;

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
          {isCompressing ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            <Upload className="size-8" />
          )}
        </div>
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          {isCompressing
            ? "画像を圧縮中..."
            : "クリックしてアップロード、またはドラッグ＆ドロップ"}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          高解像度のJPGまたはPNG（最大10MBまで）
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          {photos.length}/{maxPhotos}枚選択中
        </p>
      </div>

      {/* 選択済み写真のプレビュー */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={photo.previewUrl}
                alt={`写真 ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
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
