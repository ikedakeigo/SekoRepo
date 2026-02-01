/**
 * 写真編集カードコンポーネント
 * レポート詳細画面の編集モードで使用
 * - ファイルアップロードなし（既存写真のURL使用）
 * - 削除ボタンなし
 * - 写真種類は読み取り専用（バッジ表示）
 */

"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PHOTO_TYPE_LABELS } from "@/types";
import type { PhotoEditData } from "@/types";

interface PhotoEditCardProps {
  data: PhotoEditData;
  onChange: (data: PhotoEditData) => void;
  index: number;
  total: number;
  errors?: {
    title?: string;
    comment?: string;
    customerFeedback?: string;
  };
}

/**
 * 編集可能な写真カード
 */
export const PhotoEditCard = ({
  data,
  onChange,
  index,
  total,
  errors,
}: PhotoEditCardProps) => {
  const handleChange = <K extends keyof PhotoEditData>(
    key: K,
    value: PhotoEditData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  const showCustomerFeedback = data.photoType === "after";

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {index + 1}枚目 / {total}枚
          </span>
          <Badge variant="secondary">{PHOTO_TYPE_LABELS[data.photoType]}</Badge>
        </div>

        {/* サムネイル */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
          <Image
            src={data.photoUrl}
            alt={data.title || `写真 ${index + 1}`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* タイトル */}
        <div className="space-y-2">
          <Label htmlFor={`title-${data.id}`}>
            何の写真？ <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`title-${data.id}`}
            value={data.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="例: 大棟のズレ発見"
            maxLength={200}
          />
          {errors?.title && (
            <p className="text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* コメント */}
        <div className="space-y-2">
          <Label htmlFor={`comment-${data.id}`}>コメント</Label>
          <Textarea
            id={`comment-${data.id}`}
            value={data.comment}
            onChange={(e) => handleChange("comment", e.target.value)}
            placeholder="任意で詳細を記入"
            rows={2}
            maxLength={1000}
          />
          {errors?.comment && (
            <p className="text-sm text-red-500">{errors.comment}</p>
          )}
        </div>

        {/* お客様の反応（アフターのみ） */}
        {showCustomerFeedback && (
          <div className="space-y-2">
            <Label htmlFor={`feedback-${data.id}`}>お客様の反応</Label>
            <Textarea
              id={`feedback-${data.id}`}
              value={data.customerFeedback}
              onChange={(e) => handleChange("customerFeedback", e.target.value)}
              placeholder="お客様からの声があれば記入"
              rows={2}
              maxLength={500}
            />
            {errors?.customerFeedback && (
              <p className="text-sm text-red-500">{errors.customerFeedback}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
