/**
 * 遅延読み込み対応の画像コンポーネント
 * Next.js Image のラッパー
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
}

/**
 * 遅延読み込み画像
 * - 読み込み中: Skeleton表示
 * - エラー時: アイコンフォールバック
 * - unoptimized: 外部ストレージ画像はサーバー側最適化をスキップ
 */
export function LazyImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  containerClassName,
  priority = false,
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // src変更時に状態をリセット
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          containerClassName
        )}
      >
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("relative", containerClassName)}>
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        unoptimized
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
