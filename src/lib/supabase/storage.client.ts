/**
 * Supabase Storage クライアント用操作関数
 * ブラウザから直接アップロードするための関数
 */

import { createClient } from "./client";

const BUCKET_NAME = "photos";

/**
 * 写真を直接Supabase Storageにアップロード
 * @param file - アップロードするファイル
 * @param userId - ユーザーID（フォルダ名として使用）
 * @returns アップロードした写真の公開URL
 */
export const uploadPhotoClient = async (
  file: File,
  userId: string
): Promise<string> => {
  const supabase = createClient();

  // ファイル名を生成（重複防止）
  const fileExt = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2);
  const fileName = `${userId}/${timestamp}-${randomId}.${fileExt}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`写真のアップロードに失敗しました: ${error.message}`);
  }

  // 公開URLを取得
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

  return publicUrl;
};

/**
 * 複数の写真を並列でアップロード
 * @param files - アップロードするファイルの配列
 * @param userId - ユーザーID
 * @param onProgress - 進捗コールバック（完了数, 全体数）
 * @returns アップロードした写真のURLの配列
 */
export const uploadPhotosClient = async (
  files: File[],
  userId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  let completed = 0;

  // 並列でアップロード（最大3並列）
  const chunkSize = 3;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const chunkUrls = await Promise.all(
      chunk.map(async (file) => {
        const url = await uploadPhotoClient(file, userId);
        completed++;
        onProgress?.(completed, files.length);
        return url;
      })
    );
    urls.push(...chunkUrls);
  }

  return urls;
};

/**
 * 写真URLからファイルパスを抽出
 * @param photoUrl - 公開URL
 * @returns ファイルパス（バケット以降）
 */
const extractFilePathFromUrl = (photoUrl: string): string | null => {
  const match = photoUrl.match(/\/photos\/(.+)$/);
  return match ? match[1] : null;
};

/**
 * アップロード済みの写真を削除
 * @param photoUrls - 削除する写真のURL配列
 */
export const deleteUploadedPhotosClient = async (
  photoUrls: string[]
): Promise<void> => {
  if (photoUrls.length === 0) return;

  const supabase = createClient();

  const filePaths = photoUrls
    .map(extractFilePathFromUrl)
    .filter((path): path is string => path !== null);

  if (filePaths.length === 0) return;

  await supabase.storage.from(BUCKET_NAME).remove(filePaths);
};
