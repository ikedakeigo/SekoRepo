/**
 * レポートフォームのバリデーションスキーマ
 */

import { z } from "zod";

/** 写真の種類 */
export const photoTypeSchema = z.enum(["before", "during", "after", "other"]);

/** 写真データ */
export const photoFormSchema = z.object({
  file: z.instanceof(File).nullable(),
  previewUrl: z.string(),
  photoType: photoTypeSchema,
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは200文字以内で入力してください"),
  comment: z
    .string()
    .max(1000, "コメントは1000文字以内で入力してください")
    .optional()
    .default(""),
  customerFeedback: z
    .string()
    .max(500, "お客様の反応は500文字以内で入力してください")
    .optional()
    .default(""),
});

/** レポートフォーム */
export const reportFormSchema = z.object({
  projectId: z.string().min(1, "案件を選択してください"),
  photos: z
    .array(photoFormSchema)
    .min(1, "写真を1枚以上選択してください")
    .max(10, "写真は10枚まで選択できます"),
});

/** 案件作成 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "案件名は必須です")
    .max(100, "案件名は100文字以内で入力してください"),
  location: z
    .string()
    .max(200, "場所は200文字以内で入力してください")
    .optional(),
});

export type PhotoFormSchemaType = z.infer<typeof photoFormSchema>;
export type ReportFormSchemaType = z.infer<typeof reportFormSchema>;
export type CreateProjectSchemaType = z.infer<typeof createProjectSchema>;
