/**
 * Supabase Storage 操作関数
 */

import { createClient } from "./server";

/** ストレージバケット名 */
const BUCKET_NAME = "photos";

/**
 * 写真をアップロード
 * @param file - アップロードするファイル
 * @param reportId - レポートID（フォルダ名として使用）
 * @returns アップロードした写真の公開URL
 */
export const uploadPhoto = async (
  file: File,
  reportId: string
): Promise<string> => {
  const supabase = await createClient();

  // ファイル名を生成（重複防止）
  const fileExt = file.name.split(".").pop();
  const fileName = `${reportId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
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
 * 写真を削除
 * @param photoUrl - 削除する写真のURL
 */
export const deletePhoto = async (photoUrl: string): Promise<void> => {
  const supabase = await createClient();

  // URLからパスを抽出
  const path = photoUrl.split(`/${BUCKET_NAME}/`)[1];

  if (!path) {
    throw new Error("無効な写真URLです");
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    throw new Error(`写真の削除に失敗しました: ${error.message}`);
  }
};

/**
 * 署名付きURLを取得（一時的なアクセス用）
 * @param photoUrl - 写真のURL
 * @param expiresIn - 有効期限（秒）デフォルト: 3600秒（1時間）
 * @returns 署名付きURL
 */
export const getSignedUrl = async (
  photoUrl: string,
  expiresIn: number = 3600
): Promise<string> => {
  const supabase = await createClient();

  // URLからパスを抽出
  const path = photoUrl.split(`/${BUCKET_NAME}/`)[1];

  if (!path) {
    throw new Error("無効な写真URLです");
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`署名付きURLの取得に失敗しました: ${error.message}`);
  }

  return data.signedUrl;
};
