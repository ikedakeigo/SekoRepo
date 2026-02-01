/**
 * 写真表示カードコンポーネント（読み取り専用）
 * レポート詳細画面の閲覧モードで使用
 */

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PHOTO_TYPE_LABELS } from "@/types";
import type { PhotoType } from "@/types";

interface PhotoViewCardProps {
  photoUrl: string;
  photoType: PhotoType;
  title: string;
  comment?: string | null;
  customerFeedback?: string | null;
  index: number;
  total: number;
}

/**
 * 読み取り専用の写真表示カード
 */
export const PhotoViewCard = ({
  photoUrl,
  photoType,
  title,
  comment,
  customerFeedback,
  index,
  total,
}: PhotoViewCardProps) => {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {index + 1}枚目 / {total}枚
          </span>
          <Badge variant="secondary">{PHOTO_TYPE_LABELS[photoType]}</Badge>
        </div>

        {/* 写真 */}
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
          <Image
            src={photoUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* タイトル */}
        <h3 className="font-medium">{title}</h3>

        {/* コメント */}
        {comment && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {comment}
          </p>
        )}

        {/* お客様の反応（アフターのみ） */}
        {photoType === "after" && customerFeedback && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">お客様の反応</p>
            <p className="text-sm whitespace-pre-wrap">{customerFeedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
