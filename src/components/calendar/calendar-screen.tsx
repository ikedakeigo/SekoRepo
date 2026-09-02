/**
 * カレンダー画面（サーバーコンポーネント）
 * 初期データをフェッチして CalendarView に渡す
 * /calendar（スタッフ・管理者共通ルート）から利用する
 */

import { getEventLabels, getEventsByRange } from "@/actions/events";
import { getActiveProjects } from "@/actions/projects";
import {
  keyToDay,
  monthGridRange,
  todayKey,
} from "@/lib/calendar/date-utils";
import { CalendarView } from "./calendar-view";

interface CalendarScreenProps {
  /** URL の ?date=YYYY-MM-DD */
  dateParam?: string;
  variant?: "staff" | "admin";
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function CalendarScreen({
  dateParam,
  variant = "staff",
}: CalendarScreenProps) {
  const initialDateKey =
    dateParam && DATE_KEY_PATTERN.test(dateParam) ? dateParam : todayKey();

  const { year, month } = keyToDay(initialDateKey);
  const range = monthGridRange(year, month);

  const [events, labels, projects] = await Promise.all([
    getEventsByRange(range.start, range.end),
    getEventLabels(),
    getActiveProjects(),
  ]);

  return (
    <CalendarView
      initialDateKey={initialDateKey}
      initialEvents={events}
      labels={labels}
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      variant={variant}
    />
  );
}
