/**
 * プロジェクト一覧ヘッダーコンポーネント
 * 検索、フィルター、アクションボタンを含む
 */

"use client";

import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterStatus = "all" | "active" | "completed" | "posted";

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "active", label: "進行中" },
  { value: "completed", label: "完了" },
  { value: "posted", label: "投稿済" },
];

interface ProjectsHeaderProps {
  projectCount: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  onCreateProject: () => void;
}

export const ProjectsHeader = ({
  projectCount,
  filteredCount,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onCreateProject,
}: ProjectsHeaderProps) => {
  const isFiltered = searchQuery !== "" || activeFilter !== "all";

  return (
    <div className="mb-8">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <span className="text-slate-500 dark:text-slate-400">管理者</span>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="font-semibold text-slate-900 dark:text-white">
          案件一覧
        </span>
      </div>

      {/* タイトルと説明 */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          案件管理
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          施工現場の案件を管理・監視します。
          {isFiltered
            ? `${filteredCount}件表示中（全${projectCount}件）`
            : `全${projectCount}件`}
        </p>
      </div>

      {/* 検索とフィルター */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* 検索バー */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <input
              type="text"
              placeholder="案件名、場所、説明で検索..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
            />
          </div>
        </div>

        {/* フィルタータブ */}
        <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-colors",
                activeFilter === option.value
                  ? "bg-primary text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 案件作成ボタン */}
        <Button
          onClick={onCreateProject}
          className="bg-primary hover:bg-primary/90 text-white shadow-sm"
        >
          <Plus className="size-4 mr-2" />
          案件を作成
        </Button>
      </div>
    </div>
  );
};
