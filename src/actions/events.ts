/**
 * カレンダー予定のServer Actions
 */

"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth";
import { revalidatePath } from "next/cache";
import { eventInputSchema } from "@/lib/validations/event";
import type {
  ActionResult,
  CalendarEventWithRelations,
  EventInput,
  EventLabel,
} from "@/types";

const eventInclude = {
  label: {
    select: {
      id: true,
      name: true,
      color: true,
      sortOrder: true,
      isActive: true,
    },
  },
  project: {
    select: { id: true, name: true },
  },
  creator: {
    select: { id: true, name: true },
  },
} as const;

const revalidateCalendar = () => {
  revalidatePath("/calendar");
};

/**
 * 期間内の予定一覧を取得
 * 範囲条件: startAt <= end AND endAt >= start（範囲をまたぐ複数日予定も含む）
 */
export const getEventsByRange = async (
  start: Date,
  end: Date
): Promise<CalendarEventWithRelations[]> => {
  await requireAuth();

  const events = await prisma.calendarEvent.findMany({
    where: {
      startAt: { lte: end },
      endAt: { gte: start },
    },
    include: eventInclude,
    orderBy: { startAt: "asc" },
  });

  return events;
};

/**
 * 予定ラベル一覧を取得（有効なもののみ）
 */
export const getEventLabels = async (): Promise<EventLabel[]> => {
  await requireAuth();

  const labels = await prisma.eventLabel.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      color: true,
      sortOrder: true,
      isActive: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  return labels;
};

/**
 * 予定を作成
 */
export const createEvent = async (
  input: EventInput
): Promise<ActionResult<CalendarEventWithRelations>> => {
  try {
    const userId = await requireAuth();

    const parsed = eventInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません",
      };
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title: parsed.data.title,
        labelId: parsed.data.labelId,
        isAllDay: parsed.data.isAllDay,
        startAt: parsed.data.startAt,
        endAt: parsed.data.endAt,
        projectId: parsed.data.projectId ?? null,
        location: parsed.data.location || null,
        description: parsed.data.description || null,
        createdBy: userId,
      },
      include: eventInclude,
    });

    revalidateCalendar();
    return { success: true, data: event };
  } catch (error) {
    console.error("予定の作成に失敗しました:", error);
    return { success: false, error: "予定の作成に失敗しました" };
  }
};

/**
 * 予定を更新
 */
export const updateEvent = async (
  eventId: string,
  input: EventInput
): Promise<ActionResult<CalendarEventWithRelations>> => {
  try {
    await requireAuth();

    const parsed = eventInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません",
      };
    }

    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: parsed.data.title,
        labelId: parsed.data.labelId,
        isAllDay: parsed.data.isAllDay,
        startAt: parsed.data.startAt,
        endAt: parsed.data.endAt,
        projectId: parsed.data.projectId ?? null,
        location: parsed.data.location || null,
        description: parsed.data.description || null,
      },
      include: eventInclude,
    });

    revalidateCalendar();
    return { success: true, data: event };
  } catch (error) {
    console.error("予定の更新に失敗しました:", error);
    return { success: false, error: "予定の更新に失敗しました" };
  }
};

/**
 * 予定を削除
 */
export const deleteEvent = async (eventId: string): Promise<ActionResult> => {
  try {
    await requireAuth();

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    revalidateCalendar();
    return { success: true };
  } catch (error) {
    console.error("予定の削除に失敗しました:", error);
    return { success: false, error: "予定の削除に失敗しました" };
  }
};
