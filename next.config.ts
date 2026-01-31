import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actionsのボディサイズ制限を増加（写真アップロード用）
  // 最大10枚 × 10MB = 100MB
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  // Supabase Storageの画像を許可
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
