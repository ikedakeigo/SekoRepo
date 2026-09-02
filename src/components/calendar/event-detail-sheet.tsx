/**
 * 予定詳細（ハーフハイトのボトムシート）
 */

"use client";

import { useState } from "react";
import type { CalendarEventWithRelations } from "@/types";
import {
  formatDayLabel,
  formatShortDayLabel,
  toDateKey,
  toTimeLabel,
} from "@/lib/calendar/date-utils";
import { isMultiDay } from "@/lib/calendar/event-layout";
import { BottomSheet } from "./bottom-sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EventDetailSheetProps {
  open: boolean;
  event: CalendarEventWithRelations | null;
  onClose: () => void;
  onEdit: (event: CalendarEventWithRelations) => void;
  onDelete: (event: CalendarEventWithRelations) => Promise<void>;
}

const whenText = (event: CalendarEventWithRelations): string => {
  if (isMultiDay(event)) {
    return `${formatShortDayLabel(toDateKey(event.startAt))} 〜 ${formatShortDayLabel(toDateKey(event.endAt))} 終日`;
  }
  if (event.isAllDay) {
    return `${formatDayLabel(toDateKey(event.startAt))} 終日`;
  }
  return `${formatDayLabel(toDateKey(event.startAt))} ${toTimeLabel(event.startAt)} – ${toTimeLabel(event.endAt)}`;
};

const DetailRow = ({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => (
  <div
    className={`flex gap-3.5 border-t border-slate-200 py-3 dark:border-slate-800 ${
      last ? "border-b" : ""
    }`}
  >
    <span className="w-[60px] flex-none text-[12.5px] font-bold text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <span className="min-w-0 text-sm font-medium leading-relaxed text-slate-900 whitespace-pre-wrap dark:text-white">
      {value}
    </span>
  </div>
);

export function EventDetailSheet({
  open,
  event,
  onClose,
  onEdit,
  onDelete,
}: EventDetailSheetProps) {
  const [deleting, setDeleting] = useState(false);

  if (!event) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(event);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title="予定詳細"
    >
      {/* グラバー */}
      <div className="flex flex-none justify-center pt-2.5 pb-0.5">
        <span className="block h-1 w-[38px] rounded-full bg-slate-300 dark:bg-slate-600" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3">
        {/* ラベルピル */}
        <div
          className="inline-flex h-7 items-center rounded-full px-3"
          style={{ backgroundColor: event.label.color }}
        >
          <span className="text-[11.5px] font-bold text-white">
            {event.label.name}
          </span>
        </div>

        <h2 className="mt-3 text-[22px] font-bold leading-tight text-slate-900 dark:text-white">
          {event.title}
        </h2>
        <p className="mt-1.5 text-sm font-bold tabular-nums text-slate-500 dark:text-slate-400">
          {whenText(event)}
        </p>

        <div className="mt-4 flex flex-col">
          <DetailRow label="案件" value={event.project?.name ?? "—"} />
          <DetailRow label="場所" value={event.location || "—"} />
          <DetailRow label="メモ" value={event.description || "—"} />
          <DetailRow label="作成者" value={event.creator.name} last />
        </div>
      </div>

      {/* アクション */}
      <div className="flex flex-none gap-2.5 px-5 pt-3.5 pb-[26px]">
        <button
          type="button"
          onClick={() => onEdit(event)}
          className="h-[52px] flex-1 rounded-[14px] border-[1.5px] border-slate-300 bg-white text-[15px] font-bold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          編集
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={deleting}
              className="h-[52px] flex-1 rounded-[14px] border-[1.5px] border-[#D01F1F] bg-transparent text-[15px] font-bold text-[#D01F1F] transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-[#FF8A8A] dark:hover:bg-red-950/30"
            >
              {deleting ? "削除中…" : "削除"}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>予定を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                「{event.title}」を削除します。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </BottomSheet>
  );
}
