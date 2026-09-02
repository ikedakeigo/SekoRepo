/**
 * 選択日の予定リスト（カレンダー下部）
 */

"use client";

import type { CalendarEventWithRelations } from "@/types";
import { formatDayLabel, toTimeLabel } from "@/lib/calendar/date-utils";
import { isMultiDay, sortDayEvents } from "@/lib/calendar/event-layout";

interface DayEventListProps {
  selectedKey: string;
  events: CalendarEventWithRelations[];
  onEventClick: (event: CalendarEventWithRelations) => void;
}

const timeText = (event: CalendarEventWithRelations): string => {
  if (isMultiDay(event) || event.isAllDay) return "終日";
  return `${toTimeLabel(event.startAt)} – ${toTimeLabel(event.endAt)}`;
};

const subText = (event: CalendarEventWithRelations): string =>
  [event.project?.name, event.location].filter(Boolean).join(" ・ ");

export function DayEventList({
  selectedKey,
  events,
  onEventClick,
}: DayEventListProps) {
  const dayEvents = sortDayEvents(events);

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="flex flex-none items-baseline gap-2 px-[18px] pt-3 pb-2">
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {formatDayLabel(selectedKey)}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {dayEvents.length}件の予定
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3.5 pb-3.5">
        {dayEvents.length === 0 ? (
          <div className="py-6 text-center text-[12.5px] text-slate-500 dark:text-slate-400">
            予定はありません
          </div>
        ) : (
          dayEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onEventClick(event)}
              className="flex min-h-[52px] items-stretch gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
            >
              <div
                className="w-1 flex-none rounded-sm"
                style={{ backgroundColor: event.label.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
                  {timeText(event)}
                </div>
                <div className="mt-0.5 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">
                  {event.title}
                </div>
                {subText(event) && (
                  <div className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {subText(event)}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
