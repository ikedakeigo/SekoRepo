/**
 * 予定作成・編集フォーム（フルハイトのボトムシート）
 */

"use client";

import { useCallback, useState } from "react";
import type {
  ActionResult,
  CalendarEvent,
  CalendarEventWithRelations,
  EventInput,
  EventLabel,
} from "@/types";
import {
  addHoursToTime,
  allDayEnd,
  allDayStart,
  diffDays,
  fromDateKeyAndTime,
  nextFullHour,
  toDateKey,
  toTimeInputValue,
} from "@/lib/calendar/date-utils";
import { BottomSheet } from "./bottom-sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ProjectOption {
  id: string;
  name: string;
}

interface FormState {
  title: string;
  labelId: string;
  isAllDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  projectId: string;
  location: string;
  description: string;
}

interface EventFormSheetProps {
  open: boolean;
  /** 編集対象（null なら新規作成） */
  event: CalendarEventWithRelations | null;
  labels: EventLabel[];
  projects: ProjectOption[];
  /** 新規作成時の初期日付 */
  defaultDateKey: string;
  onClose: () => void;
  onSubmit: (input: EventInput) => Promise<ActionResult<CalendarEvent>>;
}

const NO_PROJECT = "__none__";

const buildInitialState = (
  event: CalendarEventWithRelations | null,
  defaultDateKey: string,
  labels: EventLabel[]
): FormState => {
  if (event) {
    return {
      title: event.title,
      labelId: event.labelId,
      isAllDay: event.isAllDay,
      startDate: toDateKey(event.startAt),
      startTime: toTimeInputValue(event.startAt),
      endDate: toDateKey(event.endAt),
      endTime: toTimeInputValue(event.endAt),
      projectId: event.projectId ?? NO_PROJECT,
      location: event.location ?? "",
      description: event.description ?? "",
    };
  }

  const defaultLabel =
    labels.find((l) => l.name === "その他") ?? labels[0] ?? null;
  const startTime = nextFullHour(new Date());
  return {
    title: "",
    labelId: defaultLabel?.id ?? "",
    isAllDay: false,
    startDate: defaultDateKey,
    startTime,
    endDate: defaultDateKey,
    endTime: addHoursToTime(startTime, 1),
    projectId: NO_PROJECT,
    location: "",
    description: "",
  };
};

export function EventFormSheet({
  open,
  event,
  labels,
  projects,
  defaultDateKey,
  onClose,
  onSubmit,
}: EventFormSheetProps) {
  // 初期化は親から渡される key の変更（開くたびに再マウント）で行う
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(event, defaultDateKey, labels)
  );
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = useCallback((update: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...update }));
    setDirty(true);
  }, []);

  /** 開始変更時に終了を同じ差分だけ追従させる */
  const patchStart = (startDate: string, startTime: string) => {
    setForm((prev) => {
      const prevStart = fromDateKeyAndTime(prev.startDate, prev.startTime);
      const nextStart = fromDateKeyAndTime(startDate, startTime);
      const prevEnd = fromDateKeyAndTime(prev.endDate, prev.endTime);
      const nextEnd = new Date(
        prevEnd.getTime() + (nextStart.getTime() - prevStart.getTime())
      );
      return {
        ...prev,
        startDate,
        startTime,
        endDate: toDateKey(nextEnd),
        endTime: toTimeInputValue(nextEnd),
      };
    });
    setDirty(true);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;
    if (dirty && !window.confirm("入力内容を破棄しますか？")) return;
    onClose();
  };

  const buildInput = (): EventInput | { error: string } => {
    const startAt = form.isAllDay
      ? allDayStart(form.startDate)
      : fromDateKeyAndTime(form.startDate, form.startTime);
    const endAt = form.isAllDay
      ? allDayEnd(form.endDate)
      : fromDateKeyAndTime(form.endDate, form.endTime);

    if (form.isAllDay && diffDays(form.endDate, form.startDate) < 0) {
      return { error: "終了日は開始日以降にしてください" };
    }
    if (!form.isAllDay && endAt.getTime() < startAt.getTime()) {
      return { error: "終了日時は開始以降にしてください" };
    }

    return {
      title: form.title.trim(),
      labelId: form.labelId,
      isAllDay: form.isAllDay,
      startAt,
      endAt,
      projectId: form.projectId === NO_PROJECT ? null : form.projectId,
      location: form.location.trim(),
      description: form.description.trim(),
    };
  };

  const handleSave = async () => {
    if (!form.title.trim() || submitting) return;

    const input = buildInput();
    if ("error" in input) {
      setError(input.error);
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await onSubmit(input);
    if (!result.success) {
      setError(result.error ?? "保存に失敗しました");
      setSubmitting(false);
    }
    // 成功時は親がシートを閉じる
  };

  const canSave = form.title.trim().length > 0 && !submitting;

  return (
    <BottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={event ? "予定編集" : "予定作成"}
      fullHeight
    >
      {/* ヘッダー */}
      <div className="flex h-14 flex-none items-center justify-between border-b border-slate-200 px-2 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          className="h-11 px-3 text-sm font-medium text-slate-500 dark:text-slate-400"
        >
          キャンセル
        </button>
        <div className="text-[15px] font-bold text-slate-900 dark:text-white">
          {event ? "予定編集" : "予定作成"}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "mr-1.5 h-10 rounded-full px-[18px] text-sm font-bold transition-colors",
            canSave
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
          )}
        >
          {submitting ? "保存中…" : "保存"}
        </button>
      </div>

      {/* フォーム本体 */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-[18px] pt-5 pb-10">
        <Input
          value={form.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="予定タイトル"
          autoFocus
          maxLength={100}
          className="h-auto rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0.5 pt-1.5 pb-3 text-[22px] font-bold shadow-none focus-visible:border-slate-900 focus-visible:ring-0 dark:border-slate-700 dark:focus-visible:border-slate-100 md:text-[22px]"
        />

        {/* ラベル選択 */}
        <div className="flex flex-col gap-2">
          <div className="text-[11.5px] font-bold tracking-wider text-slate-500 dark:text-slate-400">
            ラベル
          </div>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => {
              const selected = form.labelId === label.id;
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => patch({ labelId: label.id })}
                  className={cn(
                    "flex h-11 items-center gap-[7px] rounded-full border-[1.5px] px-[15px] text-[13.5px] font-bold text-slate-900 transition-colors dark:text-white",
                    selected
                      ? "border-slate-900 bg-slate-100 dark:border-slate-100 dark:bg-slate-800"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  )}
                >
                  <span
                    className="block size-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 終日トグル */}
        <div className="flex h-[52px] items-center justify-between border-y border-slate-200 dark:border-slate-800">
          <span className="text-[15px] font-bold text-slate-900 dark:text-white">
            終日
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.isAllDay}
            onClick={() => patch({ isAllDay: !form.isAllDay })}
            className={cn(
              "flex h-8 w-[54px] items-center rounded-full p-[3px] transition-colors",
              form.isAllDay
                ? "justify-end bg-[#22C55E]"
                : "justify-start bg-slate-300 dark:bg-slate-600"
            )}
          >
            <span className="block size-[26px] rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* 開始・終了 */}
        <div className="flex flex-col">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              開始
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => {
                  if (!e.target.value) return;
                  if (form.isAllDay) {
                    patch({ startDate: e.target.value });
                  } else {
                    patchStart(e.target.value, form.startTime);
                  }
                }}
                className="rounded-lg bg-transparent text-[15px] font-bold tabular-nums text-slate-900 dark:text-white dark:[color-scheme:dark]"
              />
              {!form.isAllDay && (
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    patchStart(form.startDate, e.target.value);
                  }}
                  className="rounded-lg bg-transparent text-[15px] font-bold tabular-nums text-slate-900 dark:text-white dark:[color-scheme:dark]"
                />
              )}
            </div>
          </div>
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              終了
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => {
                  if (!e.target.value) return;
                  patch({ endDate: e.target.value });
                }}
                className="rounded-lg bg-transparent text-[15px] font-bold tabular-nums text-slate-900 dark:text-white dark:[color-scheme:dark]"
              />
              {!form.isAllDay && (
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    patch({ endTime: e.target.value });
                  }}
                  className="rounded-lg bg-transparent text-[15px] font-bold tabular-nums text-slate-900 dark:text-white dark:[color-scheme:dark]"
                />
              )}
            </div>
          </div>
          {error && (
            <p className="pt-2 text-[13px] font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* 案件 */}
        <div className="flex flex-col gap-2">
          <div className="text-[11.5px] font-bold tracking-wider text-slate-500 dark:text-slate-400">
            案件（任意）
          </div>
          <Select
            value={form.projectId}
            onValueChange={(value) => patch({ projectId: value })}
          >
            <SelectTrigger className="h-[52px] w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-[15px] text-[15px] dark:border-slate-700 dark:bg-slate-800">
              <SelectValue placeholder="案件を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROJECT}>未選択</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 場所 */}
        <div className="flex flex-col gap-2">
          <div className="text-[11.5px] font-bold tracking-wider text-slate-500 dark:text-slate-400">
            場所
          </div>
          <Input
            value={form.location}
            onChange={(e) => patch({ location: e.target.value })}
            placeholder="現場住所・集合場所"
            maxLength={200}
            className="h-[52px] rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-[15px] text-[15px] dark:border-slate-700 dark:bg-slate-800 md:text-[15px]"
          />
        </div>

        {/* メモ */}
        <div className="flex flex-col gap-2">
          <div className="text-[11.5px] font-bold tracking-wider text-slate-500 dark:text-slate-400">
            メモ
          </div>
          <Textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="持ち物・注意事項など"
            maxLength={1000}
            className="min-h-[104px] resize-none rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-[15px] py-3 text-[15px] leading-normal dark:border-slate-700 dark:bg-slate-800 md:text-[15px]"
          />
        </div>
      </div>
    </BottomSheet>
  );
}
