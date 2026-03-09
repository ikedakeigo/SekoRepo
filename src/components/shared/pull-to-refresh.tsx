/**
 * Pull-to-Refresh コンポーネント
 * SNSアプリのような下引っ張りリロード機能を提供する
 */

"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: React.ReactNode;
  className?: string;
  /** 発動に必要な引っ張り量 (px) */
  threshold?: number;
}

const MAX_PULL_DISTANCE = 120;

export function PullToRefresh({ children, className, threshold = 80 }: PullToRefreshProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleStart = useCallback((clientY: number) => {
    if (isRefreshingRef.current) return;
    if (window.scrollY <= 0) {
      startYRef.current = clientY;
    }
  }, []);

  const handleMove = useCallback((clientY: number, preventDefault?: () => void) => {
    if (startYRef.current === null || isRefreshingRef.current) return;

    if (window.scrollY > 0) {
      startYRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      return;
    }

    const delta = clientY - startYRef.current;

    if (delta <= 0) {
      pullDistanceRef.current = 0;
      setPullDistance(0);
      return;
    }

    // 下方向に引いている → デフォルトのスクロールを止める
    preventDefault?.();

    const resistance = Math.min(delta * 0.5, MAX_PULL_DISTANCE);
    pullDistanceRef.current = resistance;
    setPullDistance(resistance);
  }, []);

  const handleEnd = useCallback(async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;

    const current = pullDistanceRef.current;

    if (current >= threshold) {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      pullDistanceRef.current = 0;
      setPullDistance(0);

      router.refresh();

      await new Promise((resolve) => setTimeout(resolve, 600));
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    } else {
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
  }, [threshold, router]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onTouchStart = (e: TouchEvent) => handleStart(e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) =>
      handleMove(e.touches[0].clientY, () => e.preventDefault());
    const onTouchEnd = () => handleEnd();

    wrapper.addEventListener("touchstart", onTouchStart, { passive: true });
    wrapper.addEventListener("touchmove", onTouchMove, { passive: false });
    wrapper.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      wrapper.removeEventListener("touchstart", onTouchStart);
      wrapper.removeEventListener("touchmove", onTouchMove);
      wrapper.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const isTriggered = progress >= 1;

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {/* インジケーター */}
      <div
        className="fixed left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
        style={{
          top: -48,
          transform: `translateY(${isRefreshing ? 56 : pullDistance}px)`,
          transition: pullDistance === 0 ? "transform 0.2s ease" : undefined,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full shadow-md transition-colors duration-200",
            isTriggered || isRefreshing
              ? "bg-primary text-white"
              : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          )}
        >
          <RefreshCw
            className={cn("size-5", isRefreshing && "animate-spin")}
            style={{
              transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
            }}
          />
        </div>
      </div>

      {/* コンテンツ: 引っ張ると下にスライド */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? "transform 0.2s ease" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
