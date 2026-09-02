/**
 * ボトムシート（下からスライドインするダイアログ）
 * TimeTree ライクな予定作成・詳細表示に使用
 */

"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** スクリーンリーダー用タイトル */
  title: string;
  /** true でほぼフルハイト（作成フォーム用）、false でコンテンツ高（詳細用） */
  fullHeight?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  fullHeight = false,
  children,
  className,
}: BottomSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-[20px] bg-white outline-none dark:bg-slate-900",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom duration-300",
            fullHeight ? "top-9 sm:top-16" : "max-h-[64svh]",
            className
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
