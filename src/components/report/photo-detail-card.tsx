/**
 * 写真詳細入力カードコンポーネント
 * 各写真の種類、タイトル、コメントを入力
 */

"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { PHOTO_TYPE_LABELS } from "@/types";
import type { PhotoFormData, PhotoType } from "@/types";

interface PhotoDetailCardProps {
  index: number;
  total: number;
  data: PhotoFormData;
  onChange: (data: PhotoFormData) => void;
  onRemove: () => void;
  errors?: {
    photoType?: string;
    title?: string;
    comment?: string;
    customerFeedback?: string;
  };
}

/** 写真種類の選択肢 */
const PHOTO_TYPES: PhotoType[] = ["before", "during", "after", "other"];

/**
 * 写真詳細入力カード
 */
export const PhotoDetailCard = ({
  index,
  total,
  data,
  onChange,
  onRemove,
  errors,
}: PhotoDetailCardProps) => {
  const handleChange = <K extends keyof PhotoFormData>(
    key: K,
    value: PhotoFormData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  const showCustomerFeedback = data.photoType === "after";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {index + 1}枚目 / {total}枚
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* サムネイル */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden">
          <Image
            src={data.previewUrl}
            alt={`写真 ${index + 1}`}
            fill
            className="object-cover"
          />
        </div>

        {/* 種類選択 */}
        <div className="space-y-2">
          <Label>
            種類 <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={data.photoType}
            onValueChange={(value) =>
              handleChange("photoType", value as PhotoType)
            }
            className="grid grid-cols-2 gap-2"
          >
            {PHOTO_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem value={type} id={`${index}-${type}`} />
                <Label
                  htmlFor={`${index}-${type}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {PHOTO_TYPE_LABELS[type]}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors?.photoType && (
            <p className="text-sm text-red-500">{errors.photoType}</p>
          )}
        </div>

        {/* タイトル */}
        <div className="space-y-2">
          <Label htmlFor={`title-${index}`}>
            何の写真？ <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`title-${index}`}
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
          <Label htmlFor={`comment-${index}`}>コメント</Label>
          <Textarea
            id={`comment-${index}`}
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
            <Label htmlFor={`feedback-${index}`}>お客様の反応</Label>
            <Textarea
              id={`feedback-${index}`}
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
