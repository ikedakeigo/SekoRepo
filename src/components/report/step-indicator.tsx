/**
 * ステップインジケーターコンポーネント
 * フォームの進行状況を表示
 */

import { cn } from "@/lib/utils";

interface Step {
  number: number;
  label: string;
  completed: boolean;
  active: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
}

export const StepIndicator = ({ steps }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-between mb-10 px-2">
      {steps.map((step, index) => (
        <div
          key={step.number}
          className="flex flex-col items-center gap-2 flex-1 relative"
        >
          {/* ステップ番号 */}
          <div
            className={cn(
              "z-10 size-8 rounded-full flex items-center justify-center font-bold text-sm",
              step.completed || step.active
                ? "bg-primary text-white"
                : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
            )}
          >
            {step.number}
          </div>

          {/* ラベル */}
          <span
            className={cn(
              "text-xs",
              step.completed || step.active
                ? "font-bold text-slate-900 dark:text-white"
                : "font-medium text-slate-500 dark:text-slate-400"
            )}
          >
            {step.label}
          </span>

          {/* コネクターライン */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "absolute left-1/2 top-4 w-full h-[2px]",
                step.completed
                  ? "bg-primary"
                  : "bg-slate-200 dark:bg-slate-700"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};
