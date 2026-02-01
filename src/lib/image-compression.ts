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

export async function compressImages(files: File[]): Promise<File[]> {
  const compressedFiles = await Promise.all(files.map(compressImage));
  return compressedFiles;
}
