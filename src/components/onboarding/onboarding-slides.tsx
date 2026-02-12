"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Rocket,
  Camera,
  MessageSquareText,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Slide {
  icon: LucideIcon;
  title: string;
  description: string;
  highlights?: string[];
  accentColor: string;
  /** Background orb colors [topRight, bottomLeft] */
  orbColors: [string, string];
}

const slides: Slide[] = [
  {
    icon: Rocket,
    title: "SekoRepoへようこそ！",
    description:
      "現場の写真とコメントをかんたんに記録・管理。\n投稿用コンテンツの作成をサポートするアプリです。",
    accentColor: "from-primary/20 to-primary/5",
    orbColors: ["bg-primary/15", "bg-violet-400/10"],
  },
  {
    icon: Camera,
    title: "写真をまとめてアップロード",
    description: "現場で撮影した写真をまとめて送れます。",
    highlights: [
      "最大10枚を一括選択",
      "ビフォー・作業中・アフターに分類",
      "自動で圧縮するので通信量も安心",
    ],
    accentColor: "from-blue-500/20 to-blue-500/5",
    orbColors: ["bg-blue-400/15", "bg-cyan-400/10"],
  },
  {
    icon: MessageSquareText,
    title: "写真ごとにコメントを追加",
    description: "写真1枚ずつに情報を追加できます。",
    highlights: [
      "タイトルで作業内容を記録",
      "コメントで詳細を補足",
      "お客様の声も残せる（アフター写真）",
    ],
    accentColor: "from-amber-500/20 to-amber-500/5",
    orbColors: ["bg-amber-400/15", "bg-orange-400/10"],
  },
  {
    icon: FolderOpen,
    title: "案件を選んで送信するだけ",
    description: "あとは案件を選んで送信ボタンを押すだけ。",
    highlights: [
      "案件を選択 or 新規作成",
      "ワンタップで送信完了",
      "送信履歴はいつでも確認",
    ],
    accentColor: "from-emerald-500/20 to-emerald-500/5",
    orbColors: ["bg-emerald-400/15", "bg-teal-400/10"],
  },
];

export function OnboardingSlides() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === slides.length - 1;

  // Reset animation state after transition
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || index === currentIndex) return;
      setDirection(index > currentIndex ? "next" : "prev");
      setIsAnimating(true);
      setCurrentIndex(index);
    },
    [isAnimating, currentIndex]
  );

  const goNext = useCallback(() => {
    if (!isLastSlide) goTo(currentIndex + 1);
  }, [isLastSlide, currentIndex, goTo]);

  const goPrev = useCallback(() => {
    if (!isFirstSlide) goTo(currentIndex - 1);
  }, [isFirstSlide, currentIndex, goTo]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      const threshold = 50;

      if (diff > threshold && !isLastSlide) {
        goNext();
      } else if (diff < -threshold && !isFirstSlide) {
        goPrev();
      }
      touchStartX.current = null;
    },
    [goNext, goPrev, isLastSlide, isFirstSlide]
  );

  const currentSlide = slides[currentIndex];
  const Icon = currentSlide.icon;

  return (
    <div
      className="relative flex flex-1 flex-col px-6 py-8 select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top-right gradient orb */}
        <div
          className={cn(
            "absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl transition-colors duration-700",
            currentSlide.orbColors[0]
          )}
        />

        {/* Bottom-left gradient orb */}
        <div
          className={cn(
            "absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl transition-colors duration-700",
            currentSlide.orbColors[1]
          )}
        />

        {/* Center subtle ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full border border-primary/5" />
      </div>

      {/* Top: Skip / Login links */}
      <div className="flex items-center justify-between">
        {!isLastSlide ? (
          <button
            type="button"
            onClick={() => goTo(slides.length - 1)}
            className="min-h-11 min-w-11 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            スキップ
          </button>
        ) : (
          <div />
        )}
        <Link
          href="/login"
          className="min-h-11 min-w-11 flex items-center justify-end text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ログイン
        </Link>
      </div>

      {/* Slide content with animation */}
      <div className="flex flex-1 flex-col items-center justify-center text-center gap-6 overflow-hidden">
        <div
          key={currentIndex}
          className={cn(
            "flex flex-col items-center gap-6 w-full",
            "motion-safe:animate-slide-in",
            direction === "prev" && "motion-safe:direction-reverse"
          )}
        >
          {/* Icon with gradient background */}
          <div
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br",
              currentSlide.accentColor
            )}
          >
            <Icon className="h-12 w-12 text-primary" strokeWidth={1.5} />
          </div>

          <h1 className="text-2xl font-bold leading-tight whitespace-pre-line tracking-tight">
            {currentSlide.title}
          </h1>

          <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-[15px]">
            {currentSlide.description}
          </p>

          {currentSlide.highlights && (
            <ul className="space-y-3 text-left w-full max-w-75">
              {currentSlide.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-foreground/80"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <nav
        className="flex items-center justify-center gap-2 py-6"
        role="tablist"
        aria-label="オンボーディングスライド"
      >
        {slides.map((slide, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`スライド ${index + 1}: ${slide.title}`}
            onClick={() => goTo(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 cursor-pointer min-w-11 min-h-11 flex items-center justify-center p-0",
              "after:block after:h-2 after:rounded-full after:transition-all after:duration-300",
              index === currentIndex
                ? "after:w-6 after:bg-primary"
                : "after:w-2 after:bg-muted-foreground/30 hover:after:bg-muted-foreground/50"
            )}
          />
        ))}
      </nav>

      {/* Navigation buttons */}
      <div className="flex items-center gap-3">
        {!isFirstSlide ? (
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            aria-label="前のスライド"
            className="h-11 w-11 shrink-0 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-11 shrink-0" />
        )}

        {isLastSlide ? (
          <Button className="flex-1 h-11 cursor-pointer" asChild>
            <Link href="/signup">新規登録する</Link>
          </Button>
        ) : (
          <Button className="flex-1 h-11 cursor-pointer" onClick={goNext}>
            次へ
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}

        <div className="w-11 shrink-0" />
      </div>
    </div>
  );
}
