/**
 * カレンダー予定のバリデーションスキーマ
 */

import { z } from "zod";

/** 予定作成・更新（Server Action 入力） */
export const eventInputSchema = z
  .object({
    title: z
      .string()
      .min(1, "タイトルは必須です")
      .max(100, "タイトルは100文字以内で入力してください"),
    labelId: z.string().min(1, "ラベルを選択してください"),
    isAllDay: z.boolean(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    projectId: z.string().min(1).nullable().optional(),
    location: z
      .string()
      .max(200, "場所は200文字以内で入力してください")
      .optional()
      .default(""),
    description: z
      .string()
      .max(1000, "メモは1000文字以内で入力してください")
      .optional()
      .default(""),
  })
  .refine((data) => data.endAt.getTime() >= data.startAt.getTime(), {
    message: "終了日時は開始以降にしてください",
    path: ["endAt"],
  });

export type EventInputSchemaType = z.infer<typeof eventInputSchema>;
