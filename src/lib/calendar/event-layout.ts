/**
 * カレンダー予定の配置ロジック
 *
 * - 複数日予定: 週行をまたぐ連続バーとしてレーン（段）に詰める
 * - 単日予定: セル内チップ。バーのレーン数ぶん表示可能数が減る
 */

import type { CalendarEventWithRelations } from "@/types";
import { addDaysToKey, diffDays, toDateKey } from "./date-utils";

/** セル内に表示できる項目数の上限（バー含む） */
export const MAX_CELL_ITEMS = 3;

/** 週行に配置された複数日バー */
export interface WeekBar {
  event: CalendarEventWithRelations;
  /** 0始まりのレーン番号（上から詰める） */
  lane: number;
  /** 週内の開始列 0-6 */
  startCol: number;
  /** 週内で占める列数 1-7 */
  span: number;
  /** 実際の開始日を含む週か（true なら左端を角丸に） */
  roundedStart: boolean;
  /** 実際の終了日を含む週か（true なら右端を角丸に） */
  roundedEnd: boolean;
}

/** 複数日予定か（JST の日付で判定） */
export const isMultiDay = (event: {
  startAt: Date;
  endAt: Date;
}): boolean => toDateKey(event.startAt) !== toDateKey(event.endAt);

/** 指定日に発生する予定か */
export const occursOnDay = (
  event: { startAt: Date; endAt: Date },
  dateKey: string
): boolean =>
  toDateKey(event.startAt) <= dateKey && dateKey <= toDateKey(event.endAt);

/** 指定日の予定一覧（複数日予定も含む） */
export const eventsOnDay = (
  events: CalendarEventWithRelations[],
  dateKey: string
): CalendarEventWithRelations[] =>
  events.filter((e) => occursOnDay(e, dateKey));

/** 日別リスト用の並び順（終日・複数日が先、それ以外は開始時刻順） */
export const sortDayEvents = (
  events: CalendarEventWithRelations[]
): CalendarEventWithRelations[] =>
  [...events].sort((a, b) => {
    const aAllDay = isMultiDay(a) || a.isAllDay ? 0 : 1;
    const bAllDay = isMultiDay(b) || b.isAllDay ? 0 : 1;
    if (aAllDay !== bAllDay) return aAllDay - bAllDay;
    return a.startAt.getTime() - b.startAt.getTime();
  });

/** 指定日のセル内チップ対象（単日予定のみ・開始時刻順） */
export const chipsOnDay = (
  events: CalendarEventWithRelations[],
  dateKey: string
): CalendarEventWithRelations[] =>
  sortDayEvents(
    events.filter((e) => !isMultiDay(e) && toDateKey(e.startAt) === dateKey)
  );

/**
 * 週行の複数日バーを算出しレーンに詰める
 * @param events 表示範囲の全予定
 * @param weekStartKey 週の先頭日（日曜）の dateKey
 */
export const layoutWeekBars = (
  events: CalendarEventWithRelations[],
  weekStartKey: string
): { bars: WeekBar[]; laneCount: number } => {
  const weekEndKey = addDaysToKey(weekStartKey, 6);

  const multiDayEvents = events
    .filter(isMultiDay)
    .filter((e) => {
      const startKey = toDateKey(e.startAt);
      const endKey = toDateKey(e.endAt);
      return startKey <= weekEndKey && endKey >= weekStartKey;
    })
    .sort((a, b) => {
      const diff = a.startAt.getTime() - b.startAt.getTime();
      if (diff !== 0) return diff;
      // 同時開始は長い方を先に（レーンが安定する）
      return b.endAt.getTime() - a.endAt.getTime();
    });

  // レーンごとの占有区間 [startCol, endCol)
  const lanes: { start: number; end: number }[][] = [];
  const bars: WeekBar[] = [];

  for (const event of multiDayEvents) {
    const startKey = toDateKey(event.startAt);
    const endKey = toDateKey(event.endAt);
    const clippedStart = startKey > weekStartKey ? startKey : weekStartKey;
    const clippedEnd = endKey < weekEndKey ? endKey : weekEndKey;

    const startCol = diffDays(clippedStart, weekStartKey);
    const span = diffDays(clippedEnd, clippedStart) + 1;

    let lane = 0;
    while (
      lanes[lane]?.some((r) => startCol < r.end && r.start < startCol + span)
    ) {
      lane++;
    }
    if (!lanes[lane]) lanes[lane] = [];
    lanes[lane].push({ start: startCol, end: startCol + span });

    bars.push({
      event,
      lane,
      startCol,
      span,
      roundedStart: startKey >= weekStartKey,
      roundedEnd: endKey <= weekEndKey,
    });
  }

  return { bars, laneCount: lanes.length };
};
