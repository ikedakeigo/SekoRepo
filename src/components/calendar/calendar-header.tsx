/**
 * カレンダーヘッダー（年月表示・前後移動・今日ボタン）
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel } from "@/lib/calendar/date-utils";

interface CalendarHeaderProps {
  year: number;
  /** 0-11 */
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex h-[58px] flex-none items-center gap-1 border-b border-slate-200 px-2.5 dark:border-slate-800">
      <button
        type="button"
        onClick={onPrevMonth}
        aria-label="前の月"
        className="flex size-11 items-center justify-center rounded-xl text-slate-900 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
      >
        <ChevronLeft className="size-6" />
      </button>
      <div className="min-w-[132px] text-center text-xl font-bold text-slate-900 dark:text-white">
        {formatMonthLabel(year, month)}
      </div>
      <button
        type="button"
        onClick={onNextMonth}
        aria-label="次の月"
        className="flex size-11 items-center justify-center rounded-xl text-slate-900 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
      >
        <ChevronRight className="size-6" />
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onToday}
        className="h-9 rounded-full border-[1.5px] border-slate-300 bg-white px-4 text-[13px] font-bold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
      >
        今日
      </button>
    </div>
  );
}
