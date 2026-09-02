/**
 * カレンダー用の日付ユーティリティ
 *
 * サーバー（UTC）とクライアント（JST）のどちらで実行しても同じ結果になるよう、
 * 「日付」の計算はすべて JST 固定で行う。
 * 日付は "YYYY-MM-DD" 形式の dateKey（JST基準）で受け渡しする。
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 曜日ラベル（日曜始まり） */
export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** カレンダー上の1日 */
export interface CalendarDay {
  /** "YYYY-MM-DD"（JST） */
  key: string;
  year: number;
  /** 0-11 */
  month: number;
  day: number;
  /** 0=日曜 */
  dayOfWeek: number;
}

const pad = (n: number): string => String(n).padStart(2, "0");

/** 絶対時刻 → JST の dateKey */
export const toDateKey = (date: Date): string => {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`;
};

/** 今日（JST）の dateKey */
export const todayKey = (): string => toDateKey(new Date());

/** dateKey → CalendarDay */
export const keyToDay = (key: string): CalendarDay => {
  const [y, m, d] = key.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { key, year: y, month: m - 1, day: d, dayOfWeek };
};

/** dateKey に日数を加算 */
export const addDaysToKey = (key: string, days: number): string => {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

/** dateKey 同士の日数差（a - b） */
export const diffDays = (a: string, b: string): number => {
  const toEpochDays = (key: string): number => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / DAY_MS;
  };
  return Math.round(toEpochDays(a) - toEpochDays(b));
};

/**
 * 月グリッドを生成（日曜始まり・6週固定 = 42日）
 * @param year 西暦
 * @param month 0-11
 */
export const buildMonthGrid = (year: number, month: number): CalendarDay[][] => {
  const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const gridStart = new Date(Date.UTC(year, month, 1 - firstDayOfWeek));

  const weeks: CalendarDay[][] = [];
  for (let w = 0; w < 6; w++) {
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(gridStart.getTime() + (w * 7 + i) * DAY_MS);
      days.push({
        key: `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`,
        year: dt.getUTCFullYear(),
        month: dt.getUTCMonth(),
        day: dt.getUTCDate(),
        dayOfWeek: dt.getUTCDay(),
      });
    }
    weeks.push(days);
  }
  return weeks;
};

/** 月グリッドが対象とするデータ取得範囲（グリッド先頭日〜末尾日の JST 全域） */
export const monthGridRange = (
  year: number,
  month: number
): { start: Date; end: Date } => {
  const weeks = buildMonthGrid(year, month);
  const firstKey = weeks[0][0].key;
  const lastKey = weeks[5][6].key;
  return {
    start: new Date(`${firstKey}T00:00:00+09:00`),
    end: new Date(`${lastKey}T23:59:59.999+09:00`),
  };
};

/** "2026年9月" */
export const formatMonthLabel = (year: number, month: number): string =>
  `${year}年${month + 1}月`;

/** "9月2日（火）" */
export const formatDayLabel = (key: string): string => {
  const { month, day, dayOfWeek } = keyToDay(key);
  return `${month + 1}月${day}日（${WEEKDAY_LABELS[dayOfWeek]}）`;
};

/** "9/2（火）" */
export const formatShortDayLabel = (key: string): string => {
  const { month, day, dayOfWeek } = keyToDay(key);
  return `${month + 1}/${day}（${WEEKDAY_LABELS[dayOfWeek]}）`;
};

/** 絶対時刻 → JST の "HH:mm" */
export const toTimeLabel = (date: Date): string => {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return `${jst.getUTCHours()}:${pad(jst.getUTCMinutes())}`;
};

/** JST の日付と時刻から絶対時刻を生成 */
export const fromDateKeyAndTime = (key: string, time: string): Date =>
  new Date(`${key}T${time.padStart(5, "0")}:00+09:00`);

/** 終日予定の開始時刻（JST 00:00） */
export const allDayStart = (key: string): Date =>
  new Date(`${key}T00:00:00+09:00`);

/** 終日予定の終了時刻（JST 23:59:59） */
export const allDayEnd = (key: string): Date =>
  new Date(`${key}T23:59:59.999+09:00`);

/** 絶対時刻 → JST の "HH:mm"（フォーム input[type=time] 用、0埋め） */
export const toTimeInputValue = (date: Date): string => {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return `${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
};

/** 次の正時（JST）を "HH:mm" で返す（例: 9:20 → "10:00"、23時台は "23:00" に丸め） */
export const nextFullHour = (date: Date): string => {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const hour = Math.min(jst.getUTCHours() + 1, 23);
  return `${pad(hour)}:00`;
};

/** "HH:mm" に時間を加算（23:59 でクランプ） */
export const addHoursToTime = (time: string, hours: number): string => {
  const [h, m] = time.split(":").map(Number);
  const total = h + hours;
  if (total > 23) return "23:59";
  return `${pad(total)}:${pad(m)}`;
};
