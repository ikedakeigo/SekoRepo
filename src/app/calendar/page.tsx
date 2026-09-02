/**
 * 共有カレンダー画面（スタッフ・管理者共通）
 */

import { getCurrentUser } from "@/actions/auth";
import { CalendarScreen } from "@/components/calendar";

const CalendarPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) => {
  const [{ date }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const isAdmin = user?.role === "admin";

  if (isAdmin) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col">
        <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
          カレンダー
        </h1>
        <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CalendarScreen dateParam={date} variant="admin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CalendarScreen dateParam={date} variant="staff" />
    </div>
  );
};

export default CalendarPage;
