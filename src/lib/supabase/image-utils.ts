/**
 * Supabase Storage 画像最適化ユーティリティ
 * サーバー/クライアント非依存の純粋な変換関数
 */

/** 画像バリアント */
export type ImageVariant = "thumbnail" | "medium" | "full";

/** Supabase Storage の公開URLパターン */
const SUPABASE_PUBLIC_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_PATH = "/storage/v1/render/image/public/";

/** バリアント別の変換パラメータ */
const IMAGE_VARIANT_PARAMS: Record<ImageVariant, string> = {
  thumbnail: "width=300&height=300&resize=cover&quality=60",
  medium: "width=800&quality=80",
  full: "width=1200&quality=85",
};

/**
 * 画像URLにSupabase Image Transformation パラメータを付与
 * @param url - ベースの公開URL
 * @param variant - 画像バリアント（デフォルト: medium）
 * @returns 変換パラメータ付きURL（Supabase以外のURLはそのまま返す）
 */
export const getOptimizedImageUrl = (
  url: string,
  variant: ImageVariant = "medium"
): string => {
  if (!url || !url.includes(SUPABASE_PUBLIC_PATH)) return url;
  const renderUrl = url.replace(SUPABASE_PUBLIC_PATH, SUPABASE_RENDER_PATH);
  const separator = renderUrl.includes("?") ? "&" : "?";
  return `${renderUrl}${separator}${IMAGE_VARIANT_PARAMS[variant]}`;
};
