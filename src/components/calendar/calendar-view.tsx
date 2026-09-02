/**
 * カレンダー画面のクライアントコンテナ
 * 月状態・選択日・予定データ・シート開閉を管理する
 */

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type {
  CalendarEventWithRelations,
  EventInput,
  EventLabel,
} from "@/types";
import {
  createEvent,
  deleteEvent,
  getEventsByRange,
  updateEvent,
} from "@/actions/events";
import {
  buildMonthGrid,
  keyToDay,
  monthGridRange,
  todayKey as getTodayKey,
} from "@/lib/calendar/date-utils";
import { eventsOnDay } from "@/lib/calendar/event-layout";
import { CalendarHeader } from "./calendar-header";
import { MonthGrid } from "./month-grid";
import { DayEventList } from "./day-event-list";
import { EventFormSheet } from "./event-form-sheet";
import { EventDetailSheet } from "./event-detail-sheet";
import { cn } from "@/lib/utils";

interface ProjectOption {
  id: string;
  name: string;
}

type SheetState =
  | { type: "none" }
  | { type: "create" }
  | { type: "detail"; eventId: string }
  | { type: "edit"; eventId: string };

interface CalendarViewProps {
  initialDateKey: string;
  initialEvents: CalendarEventWithRelations[];
  labels: EventLabel[];
  projects: ProjectOption[];
  /** FAB の配置（staff: レイアウト内 absolute / admin: fixed） */
  variant?: "staff" | "admin";
}

/** 予定配列へ重複なくマージ（同 id は置き換え） */
const mergeEvents = (
  current: CalendarEventWithRelations[],
  incoming: CalendarEventWithRelations[]
): CalendarEventWithRelations[] => {
  const map = new Map(current.map((e) => [e.id, e]));
  for (const event of incoming) {
    map.set(event.id, event);
  }
  return Array.from(map.values());
};

export function CalendarView({
  initialDateKey,
  initialEvents,
  labels,
  projects,
  variant = "staff",
}: CalendarViewProps) {
  const initial = keyToDay(initialDateKey);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [selectedKey, setSelectedKey] = useState(initialDateKey);
  const [events, setEvents] = useState(initialEvents);
  const [sheet, setSheet] = useState<SheetState>({ type: "none" });
  // フォームを開くたびに再マウントして初期化するためのキー
  const [formSeq, setFormSeq] = useState(0);

  const openSheet = (next: SheetState) => {
    if (next.type === "create" || next.type === "edit") {
      setFormSeq((n) => n + 1);
    }
    setSheet(next);
  };

  const loadedMonthsRef = useRef(
    new Set([`${initial.year}-${initial.month}`])
  );
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const todayKey = getTodayKey();
  const weeks = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const syncUrl = (dateKey: string) => {
    window.history.replaceState(null, "", `?date=${dateKey}`);
  };

  /** 指定月の予定を未取得ならフェッチしてマージ */
  const ensureMonthLoaded = useCallback(async (year: number, month: number) => {
    const monthKey = `${year}-${month}`;
    if (loadedMonthsRef.current.has(monthKey)) return;
    loadedMonthsRef.current.add(monthKey);

    try {
      const range = monthGridRange(year, month);
      const fetched = await getEventsByRange(range.start, range.end);
      setEvents((prev) => mergeEvents(prev, fetched));
    } catch (error) {
      console.error("予定の取得に失敗しました:", error);
      loadedMonthsRef.current.delete(monthKey);
      toast.error("予定の取得に失敗しました");
    }
  }, []);

  const changeMonth = (delta: number) => {
    const base = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    const nextYear = base.getUTCFullYear();
    const nextMonth = base.getUTCMonth();
    setViewYear(nextYear);
    setViewMonth(nextMonth);

    // 選択日が新しい月の外なら月初に移動
    const selected = keyToDay(selectedKey);
    if (selected.year !== nextYear || selected.month !== nextMonth) {
      const firstKey = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01`;
      setSelectedKey(firstKey);
      syncUrl(firstKey);
    }

    void ensureMonthLoaded(nextYear, nextMonth);
  };

  const goToday = () => {
    const today = keyToDay(todayKey);
    setViewYear(today.year);
    setViewMonth(today.month);
    setSelectedKey(todayKey);
    syncUrl(todayKey);
    void ensureMonthLoaded(today.year, today.month);
  };

  const selectDay = (dateKey: string) => {
    setSelectedKey(dateKey);
    syncUrl(dateKey);
  };

  // スワイプで月移動
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dy) < 60) {
      changeMonth(dx < 0 ? 1 : -1);
    }
  };

  const detailEvent =
    sheet.type === "detail" || sheet.type === "edit"
      ? (events.find((e) => e.id === sheet.eventId) ?? null)
      : null;

  const handleSubmit = async (input: EventInput) => {
    const isEdit = sheet.type === "edit";
    const result = isEdit
      ? await updateEvent((sheet as { eventId: string }).eventId, input)
      : await createEvent(input);

    if (result.success && result.data) {
      const saved = result.data as CalendarEventWithRelations;
      setEvents((prev) => mergeEvents(prev, [saved]));
      setSheet({ type: "none" });
      toast.success(isEdit ? "予定を更新しました" : "予定を作成しました");
    }
    return result;
  };

  const handleDelete = async (event: CalendarEventWithRelations) => {
    const result = await deleteEvent(event.id);
    if (result.success) {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      setSheet({ type: "none" });
      toast.success("予定を削除しました");
    } else {
      toast.error(result.error ?? "予定の削除に失敗しました");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <CalendarHeader
        year={viewYear}
        month={viewMonth}
        onPrevMonth={() => changeMonth(-1)}
        onNextMonth={() => changeMonth(1)}
        onToday={goToday}
      />

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <MonthGrid
          weeks={weeks}
          viewMonth={viewMonth}
          todayKey={todayKey}
          selectedKey={selectedKey}
          events={events}
          onSelectDay={selectDay}
          onEventClick={(event) =>
            setSheet({ type: "detail", eventId: event.id })
          }
        />
      </div>

      <DayEventList
        selectedKey={selectedKey}
        events={eventsOnDay(events, selectedKey)}
        onEventClick={(event) => setSheet({ type: "detail", eventId: event.id })}
      />

      {/* FAB */}
      <button
        type="button"
        onClick={() => openSheet({ type: "create" })}
        aria-label="予定を作成"
        className={cn(
          "z-40 flex size-[60px] items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_8px_22px_rgba(0,0,0,0.3)] transition-transform active:scale-95 dark:bg-slate-100 dark:text-slate-900",
          variant === "staff"
            ? "absolute right-[18px] bottom-[88px]"
            : "fixed right-8 bottom-8"
        )}
      >
        <Plus className="size-7" />
      </button>

      {/* 作成・編集シート */}
      <EventFormSheet
        key={formSeq}
        open={sheet.type === "create" || sheet.type === "edit"}
        event={sheet.type === "edit" ? detailEvent : null}
        labels={labels}
        projects={projects}
        defaultDateKey={selectedKey}
        onClose={() => setSheet({ type: "none" })}
        onSubmit={handleSubmit}
      />

      {/* 詳細シート */}
      <EventDetailSheet
        open={sheet.type === "detail"}
        event={detailEvent}
        onClose={() => setSheet({ type: "none" })}
        onEdit={(event) => openSheet({ type: "edit", eventId: event.id })}
        onDelete={handleDelete}
      />
    </div>
  );
}
