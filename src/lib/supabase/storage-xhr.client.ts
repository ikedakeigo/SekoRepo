/**
 * XHR対応Supabase Storageアップロード
 * XMLHttpRequestを使用してバイトレベルの進捗を取得
 */

import { createClient } from "./client";

const BUCKET_NAME = "photos";

/**
 * 写真をXHRでSupabase Storageにアップロード（進捗追跡付き）
 * @param file - アップロードするファイル
 * @param userId - ユーザーID（フォルダ名として使用）
 * @param onProgress - 進捗コールバック（0〜100）
 * @returns アップロードした写真の公開URL
 */
export async function uploadPhotoWithProgress(
  file: File,
  userId: string,
  onProgress: (percent: number) => void
): Promise<string> {
  const supabase = createClient();

  // 認証トークンを取得
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("認証が必要です");
  }

  // ファイル名を生成（既存のstorage.client.tsと同じパターン）
  const rawExt = file.name.split(".").pop() || "jpg";
  const fileExt = rawExt.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2);
  const filePath = `${userId}/${timestamp}-${randomId}.${fileExt}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // 公開URLを構築
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
        resolve(publicUrl);
      } else {
        let errorMessage = `アップロード失敗: ${xhr.status}`;
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || response.error || errorMessage;
        } catch {
          // パースに失敗した場合はデフォルトメッセージを使用
        }
        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("ネットワークエラーが発生しました"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("アップロードが中断されました"));
    });

    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Cache-Control", "max-age=3600");
    xhr.send(file);
  });
}
