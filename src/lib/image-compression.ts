import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5, // 最大0.5MB
  maxWidthOrHeight: 1920, // 最大幅/高さ
  useWebWorker: true, // WebWorkerで処理（UIブロックを防ぐ）
  fileType: "image/jpeg" as const, // JPEG形式で出力（PNG含め全て変換）
};

export async function compressImage(file: File): Promise<File> {
  try {
    const compressedBlob = await imageCompression(file, COMPRESSION_OPTIONS);

    // ファイル名を.jpgに変更
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const newFileName = `${baseName}.jpg`;

    // BlobをFileに変換（正しいファイル名とMIMEタイプを設定）
    const compressedFile = new File([compressedBlob], newFileName, {
      type: "image/jpeg",
    });

    return compressedFile;
  } catch {
    // 圧縮失敗時は元のファイルを返す
    return file;
  }
}

export async function compressImages(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<File[]> {
  const total = files.length;
  let completed = 0;

  const compressedFiles = await Promise.all(
    files.map(async (file) => {
      const result = await compressImage(file);
      completed++;
      onProgress?.(completed, total);
      return result;
    })
  );

  return compressedFiles;
}

const THUMBNAIL_OPTIONS = {
  maxSizeMB: 0.05, // 50KB
  maxWidthOrHeight: 300, // 300px
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

/**
 * サムネイルを高速生成（プレビュー用）
 * @param file - 画像ファイル
 * @returns サムネイルのObject URL
 */
export async function createThumbnail(file: File): Promise<string> {
  try {
    const thumbnailBlob = await imageCompression(file, THUMBNAIL_OPTIONS);
    return URL.createObjectURL(thumbnailBlob);
  } catch {
    return URL.createObjectURL(file);
  }
}
