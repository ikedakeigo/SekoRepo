/**
 * 写真タイムラインコンポーネント
 * 案件詳細に表示する写真のタイムライン
 */

"use client";

import { useState, useTransition } from "react";
import { PhotoCard } from "./photo-card";
import { PHOTO_TYPE_LABELS } from "@/types";
import { deleteSinglePhoto } from "@/actions/reports";
import { toast } from "sonner";
import type { PhotoType } from "@/types";

interface Photo {
  id: string;
  photoUrl: string;
  photoType: string;
  title: string;
  comment?: string | null;
  customerFeedback?: string | null;
  createdAt: Date;
  reportId: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  reportCreatedAt?: Date;
}

interface PhotoTimelineProps {
  photos: Photo[];
}

/** タイムラインセクションの色設定 */
const SECTION_COLORS: Record<PhotoType, { bg: string; border: string; dot: string }> = {
  before: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
  },
  during: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  after: {
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  other: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },
};

/** 表示順 */
const PHOTO_TYPE_ORDER: PhotoType[] = ["before", "during", "after", "other"];

/**
 * 写真タイムライン
 */
export const PhotoTimeline = ({ photos }: PhotoTimelineProps) => {
  const [localPhotos, setLocalPhotos] = useState<Photo[]>(photos);
  const [, startTransition] = useTransition();
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const handleDeletePhoto = (photoId: string) => {
    const previousPhotos = localPhotos;
    setDeletingPhotoId(photoId);

    // 楽観的更新: UIから即座に除去
    setLocalPhotos((prev) => prev.filter((p) => p.id !== photoId));

    startTransition(async () => {
      try {
        await deleteSinglePhoto(photoId);
        toast.success("写真を削除しました");
      } catch (error) {
        setLocalPhotos(previousPhotos);
        toast.error("削除に失敗しました");
        console.error("Delete photo failed:", error);
      } finally {
        setDeletingPhotoId(null);
      }
    });
  };

  // 種類別にグループ化
  const groupedPhotos = PHOTO_TYPE_ORDER.reduce(
    (acc, type) => {
      acc[type] = localPhotos.filter((p) => p.photoType === type);
      return acc;
    },
    {} as Record<PhotoType, Photo[]>
  );

  if (localPhotos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        まだ写真がありません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {PHOTO_TYPE_ORDER.map((type) => {
        const typePhotos = groupedPhotos[type];
        if (typePhotos.length === 0) return null;

        const colors = SECTION_COLORS[type];

        return (
          <div key={type} className="relative">
            {/* セクションヘッダー */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
              <h3 className="font-semibold">{PHOTO_TYPE_LABELS[type]}</h3>
              <span className="text-sm text-muted-foreground">
                {typePhotos.length}枚
              </span>
            </div>

            {/* タイムラインライン */}
            <div className="relative pl-6 border-l-2 border-dashed border-muted ml-1.5 space-y-4">
              {typePhotos.map((photo) => (
                <div key={photo.id} className="relative">
                  {/* ドット */}
                  <div
                    className={`absolute -left-[1.6rem] top-4 w-2 h-2 rounded-full ${colors.dot}`}
                  />
                  <PhotoCard
                    photo={photo}
                    onDeletePhoto={handleDeletePhoto}
                    isDeleting={deletingPhotoId === photo.id}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
