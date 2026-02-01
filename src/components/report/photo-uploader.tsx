/**
 * 写真アップローダーコンポーネント
 * 複数の写真を選択してプレビュー表示
 */

"use client";

import { useRef, useCallback, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, X, Plus, Loader2 } from "lucide-react";
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

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const remainingSlots = maxPhotos - photos.length;
      const filesToAdd = Array.from(files).slice(0, remainingSlots);

      // 圧縮処理開始
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

      // inputをリセット
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [photos, onChange, maxPhotos]
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          写真を選択 <span className="text-red-500">*</span>
        </h3>
        <span className="text-sm text-muted-foreground">
          {photos.length}/{maxPhotos}枚
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
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
              onClick={() => handleRemove(index)}
              className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "aspect-square rounded-lg border-2 border-dashed",
              "flex flex-col items-center justify-center gap-1",
              "text-muted-foreground hover:text-foreground hover:border-foreground",
              "transition-colors"
            )}
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs">追加</span>
          </button>
        )}
      </div>

      {isCompressing && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">画像を圧縮中...</span>
        </div>
      )}

      {photos.length === 0 && !isCompressing && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-32"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <Camera className="h-8 w-8" />
            <span>写真を選択</span>
          </div>
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP形式 / 最大{maxPhotos}枚（自動圧縮）
      </p>
    </div>
  );
};
