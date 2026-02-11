/**
 * エクスポート関連のServer Actions
 */

"use server";

import { requireAdmin } from "./auth";
import { getProjectWithPhotos } from "./projects";
import { PHOTO_TYPE_LABELS } from "@/types";
import { format, isSameDay, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

/** CSV行をエスケープしてフォーマット */
const formatCSVRow = (row: string[]): string => {
  return row
    .map((cell) => {
      const cellStr = String(cell);
      if (cellStr.includes(",") || cellStr.includes("\n") || cellStr.includes('"')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    })
    .join(",");
};

/** BOM付きCSV文字列を生成 */
const generateCSV = (headers: string[], rows: string[][]): string => {
  const csvContent = [headers, ...rows].map(formatCSVRow).join("\n");
  const BOM = "\uFEFF";
  return BOM + csvContent;
};

/** CSVヘッダー */
const CSV_HEADERS = [
  "案件名",
  "場所",
  "写真番号",
  "種類",
  "タイトル",
  "コメント",
  "お客様の反応",
  "今日の作業について",
  "撮影者",
  "登録日",
  "画像URL",
];

/** 写真データをCSV行に変換 */
const photoToRow = (
  photo: {
    photoType: string;
    title: string;
    comment?: string | null;
    customerFeedback?: string | null;
    reportSummary?: string | null;
    createdAt: Date;
    photoUrl: string;
    user?: { name: string } | null;
  },
  index: number,
  projectName: string,
  projectLocation: string | null | undefined
): string[] => {
  const photoType = photo.photoType as keyof typeof PHOTO_TYPE_LABELS;
  return [
    projectName,
    projectLocation || "",
    String(index + 1),
    PHOTO_TYPE_LABELS[photoType] || photo.photoType,
    photo.title,
    photo.comment || "",
    photo.customerFeedback || "",
    photo.reportSummary || "",
    photo.user?.name || "",
    format(new Date(photo.createdAt), "yyyy/MM/dd HH:mm", { locale: ja }),
    photo.photoUrl,
  ];
};

/**
 * 案件データをCSV形式でエクスポート
 * @param projectId 案件ID
 * @returns BOM付きUTF-8のCSV文字列
 */
export const exportProjectToCSV = async (projectId: string): Promise<string> => {
  await requireAdmin();

  const project = await getProjectWithPhotos(projectId);

  const rows = project.photos.map((photo, index) =>
    photoToRow(photo, index, project.name, project.location)
  );

  return generateCSV(CSV_HEADERS, rows);
};

/**
 * 案件の特定日付のデータをCSV形式でエクスポート
 * @param projectId 案件ID
 * @param dateString 日付（YYYY-MM-DD形式）
 * @returns BOM付きUTF-8のCSV文字列
 */
export const exportProjectByDateToCSV = async (
  projectId: string,
  dateString: string
): Promise<string> => {
  await requireAdmin();

  const project = await getProjectWithPhotos(projectId);
  const targetDate = parseISO(dateString);

  // 指定日付の写真のみをフィルタリング
  const filteredPhotos = project.photos.filter((photo) =>
    isSameDay(new Date(photo.createdAt), targetDate)
  );

  const rows = filteredPhotos.map((photo, index) =>
    photoToRow(photo, index, project.name, project.location)
  );

  return generateCSV(CSV_HEADERS, rows);
};
