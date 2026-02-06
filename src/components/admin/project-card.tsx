/**
 * 案件カードコンポーネント
 * 案件一覧に表示するカード
 */

"use client";

import Link from "next/link";
import { FileText, Calendar, MoreVertical } from "lucide-react";
import { LazyImage } from "@/components/shared";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    location?: string | null;
    description?: string | null;
    status: string;
    createdAt: Date;
    reportCount: number;
    photoCount: number;
    thumbnailUrl?: string | null;
  };
}

/** ステータスのラベルと色 */
const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  active: {
    label: "進行中",
    bgColor: "bg-green-500/90",
    textColor: "text-white",
  },
  completed: {
    label: "完了",
    bgColor: "bg-slate-400 dark:bg-slate-600",
    textColor: "text-white",
  },
  posted: {
    label: "投稿済",
    bgColor: "bg-blue-500/90",
    textColor: "text-white",
  },
};

/**
 * 案件カード
 */
export const ProjectCard = ({ project }: ProjectCardProps) => {
  const status = project.status as ProjectStatus;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {/* カバー画像 */}
        <div className="h-40 relative overflow-hidden bg-slate-100 dark:bg-slate-700">
          {project.thumbnailUrl ? (
            <LazyImage
              src={project.thumbnailUrl}
              alt={project.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-500">
              <FileText className="size-12" />
            </div>
          )}
          {/* ステータスバッジ */}
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded",
                config.bgColor,
                config.textColor
              )}
            >
              {config.label}
            </span>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
              {project.name}
            </h3>
            <button
              className="text-slate-400 hover:text-primary transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="size-5" />
            </button>
          </div>

          {(project.description || project.location) && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
              {project.description || project.location}
            </p>
          )}

          {/* メタ情報 */}
          <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-700 pt-4 mt-4">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <FileText className="size-4" />
              <span className="text-xs font-semibold">
                {project.reportCount} レポート
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Calendar className="size-4" />
              <span className="text-xs font-semibold">
                {format(new Date(project.createdAt), "yyyy年M月", {
                  locale: ja,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

/**
 * 新規案件追加カード
 */
export const AddProjectCard = ({ onClick }: { onClick?: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="group bg-slate-50 dark:bg-slate-800/40 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center hover:border-primary/50 transition-all cursor-pointer min-h-[280px]"
    >
      <div className="bg-primary/10 text-primary p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
        <svg
          className="size-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white">
        新規案件を開始
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
        新しい現場を登録してスタッフを割り当てます
      </p>
    </button>
  );
};
