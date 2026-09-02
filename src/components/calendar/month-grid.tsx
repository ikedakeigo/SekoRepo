/**
 * 月グリッド（6週固定・日曜始まり）
 * 単日予定はセル内チップ、複数日予定は週行をまたぐ連続バーで表示
 */

"use client";

import type { CalendarEventWithRelations } from "@/types";
import type { CalendarDay } from "@/lib/calendar/date-utils";
import { WEEKDAY_LABELS } from "@/lib/calendar/date-utils";
import {
  MAX_CELL_ITEMS,
  chipsOnDay,
  layoutWeekBars,
} from "@/lib/calendar/event-layout";
import { cn } from "@/lib/utils";

/** 日付数字ブロックの高さ（pt-0.5 + h-5）: セル上端から数字直下までの px */
const DAY_NUMBER_BLOCK_HEIGHT = 22;
/** バーの縦位置: セル上端からの開始位置と1レーンの高さ（px） */
const BAR_TOP_OFFSET = 24;
const BAR_LANE_HEIGHT = 14.5;

interface MonthGridProps {
  weeks: CalendarDay[][];
  /** 表示中の月 0-11 */
  viewMonth: number;
  todayKey: string;
  selectedKey: string;
  events: CalendarEventWithRelations[];
  onSelectDay: (dateKey: string) => void;
  onEventClick: (event: CalendarEventWithRelations) => void;
}

const dayNumberColor = (dayOfWeek: number): string => {
  if (dayOfWeek === 0) return "text-[#D01F1F] dark:text-[#FF8A8A]";
  if (dayOfWeek === 6) return "text-[#1F53C4] dark:text-[#8AB4FF]";
  return "text-slate-900 dark:text-white";
};

const weekdayHeaderColor = (label: string): string => {
  if (label === "日") return "text-[#D01F1F] dark:text-[#FF8A8A]";
  if (label === "土") return "text-[#1F53C4] dark:text-[#8AB4FF]";
  return "text-slate-500 dark:text-slate-400";
};

export function MonthGrid({
  weeks,
  viewMonth,
  todayKey,
  selectedKey,
  events,
  onSelectDay,
  onEventClick,
}: MonthGridProps) {
  return (
    <div className="flex-none">
      {/* 曜日行 */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className={cn(
              "py-1.5 text-center text-[11px] font-bold",
              weekdayHeaderColor(label)
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 週行 */}
      {weeks.map((week) => {
        const { bars, laneCount } = layoutWeekBars(events, week[0].key);
        const chipRoom = Math.max(0, MAX_CELL_ITEMS - laneCount);

        return (
          <div
            key={week[0].key}
            className="relative grid h-[78px] grid-cols-7 border-b border-slate-200 dark:border-slate-800"
          >
            {week.map((day) => {
              const isToday = day.key === todayKey;
              const isSelected = day.key === selectedKey;
              const inMonth = day.month === viewMonth;
              const chips = chipsOnDay(events, day.key);
              const shown = chips.slice(0, chipRoom);
              const extra = chips.length - shown.length;

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => onSelectDay(day.key)}
                  className={cn(
                    // button は既定で内容を上下中央に寄せるため、flex-col で上詰めにする
                    "relative flex flex-col overflow-hidden border-r border-slate-200 text-left last:border-r-0 dark:border-slate-800",
                    !inMonth && "opacity-40",
                    isSelected &&
                      "bg-slate-100 ring-2 ring-inset ring-slate-900 dark:bg-slate-800 dark:ring-slate-100"
                  )}
                >
                  <div className="flex justify-center pt-0.5">
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-bold",
                        isToday
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : dayNumberColor(day.dayOfWeek)
                      )}
                    >
                      {day.day}
                    </span>
                  </div>
                  <div
                    className="flex flex-col gap-[1.5px] px-0.5"
                    style={{
                      marginTop: `${
                        BAR_TOP_OFFSET -
                        DAY_NUMBER_BLOCK_HEIGHT +
                        laneCount * BAR_LANE_HEIGHT
                      }px`,
                    }}
                  >
                    {shown.map((event) => (
                      <span
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            onEventClick(event);
                          }
                        }}
                        className="block h-[13px] overflow-hidden rounded-[3px] px-[3px] text-[9px] font-medium leading-[13px] whitespace-nowrap text-ellipsis text-white"
                        style={{ backgroundColor: event.label.color }}
                      >
                        {event.title}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="pl-[3px] text-[9px] font-bold leading-[9px] text-slate-500 dark:text-slate-400">
                        +{extra}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* 複数日バー */}
            {bars.map((bar) => (
              <button
                key={`${bar.event.id}-${bar.startCol}`}
                type="button"
                onClick={() => onEventClick(bar.event)}
                className="absolute h-[13px] overflow-hidden px-[5px] text-left text-[9.5px] font-medium leading-[14px] whitespace-nowrap text-ellipsis text-white"
                style={{
                  top: `${BAR_TOP_OFFSET + bar.lane * BAR_LANE_HEIGHT}px`,
                  left: `calc(${bar.startCol} * 100% / 7 + 2px)`,
                  width: `calc(${bar.span} * 100% / 7 - 4px)`,
                  backgroundColor: bar.event.label.color,
                  borderRadius: `${bar.roundedStart ? "4px" : "0"} ${
                    bar.roundedEnd ? "4px 4px" : "0 0"
                  } ${bar.roundedStart ? "4px" : "0"}`,
                }}
              >
                {bar.event.title}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
