/**
 * 写真詳細入力カードコンポーネント
 * 各写真の種類、タイトル、コメントを入力
 */

"use client";

import { LazyImage } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="md:flex">
        {/* プレビュー画像 */}
        <div className="md:w-1/3 h-48 md:h-auto relative">
          <LazyImage
            src={data.previewUrl}
            alt={`写真 ${index + 1}`}
            fill
            className="object-cover"
          />
          {/* 削除ボタン */}
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 left-2 bg-red-500 text-white size-8 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* フォームフィールド */}
        <div className="p-6 md:w-2/3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 種類 */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                種類
              </Label>
              <Select
                value={data.photoType}
                onValueChange={(value) =>
                  handleChange("photoType", value as PhotoType)
                }
              >
                <SelectTrigger className="w-full h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PHOTO_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors?.photoType && (
                <p className="text-xs text-red-500">{errors.photoType}</p>
              )}
            </div>

            {/* タイトル */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                タイトル <span className="text-red-500">*</span>
              </Label>
              <Input
                value={data.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="例: 大棟のズレ発見"
                maxLength={200}
                className={cn(
                  "w-full h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900",
                  errors?.title && "border-red-500 border-2"
                )}
              />
              {errors?.title && (
                <p className="text-xs text-red-500">{errors.title}</p>
              )}
            </div>
          </div>

          {/* コメント */}
          <div className="space-y-1">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              コメント
            </Label>
            <Textarea
              value={data.comment}
              onChange={(e) => handleChange("comment", e.target.value)}
              placeholder="詳細や観察点を記入..."
              rows={2}
              maxLength={1000}
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            {errors?.comment && (
              <p className="text-xs text-red-500">{errors.comment}</p>
            )}
          </div>

          {/* お客様の反応（アフターのみ） */}
          {showCustomerFeedback && (
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                お客様の反応
              </Label>
              <Textarea
                value={data.customerFeedback}
                onChange={(e) =>
                  handleChange("customerFeedback", e.target.value)
                }
                placeholder="お客様からの声があれば記入"
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
              {errors?.customerFeedback && (
                <p className="text-xs text-red-500">{errors.customerFeedback}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
