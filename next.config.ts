import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // E2E実行時はDev Toolsインジケーターがボトムナビのクリックを妨害するため無効化
  devIndicators: process.env.E2E === "1" ? false : undefined,
  // Server Actionsのボディサイズ制限を増加（写真アップロード用）
  // 最大10枚 × 10MB = 100MB
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  // Supabase Storageの画像を許可
  // リサイズは next/image（Vercel Image Optimization）側で行う。
  // Supabase の /storage/v1/render/image/ は有料プラン限定（無料プランでは
  // 403 FeatureNotEnabled → next/image が502になる）のため使用しない。
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rzkybapxiirpvtplunzp.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
