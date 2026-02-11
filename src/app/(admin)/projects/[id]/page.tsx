/**
 * 案件詳細（タイムライン）画面
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { LazyImage } from "@/components/shared";
import {
  getProjectWithPhotos,
  getProjectPostedDates,
} from "@/actions/projects";
import {
  PhotoTimeline,
  ReportDateList,
  ProjectStatusToggle,
  ProjectDeleteButton,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Calendar,
  Edit,
  Camera,
  ChevronRight,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

/** ステータス設定 */
const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  active: {
    label: "進行中",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-800 dark:text-blue-400",
  },
  completed: {
    label: "完了",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-800 dark:text-slate-300",
  },
  posted: {
    label: "投稿済",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-800 dark:text-green-400",
  },
};

const ProjectDetailPage = async ({ params }: ProjectDetailPageProps) => {
  const { id } = await params;

  let project;
  let postedDates: string[] = [];
  try {
    project = await getProjectWithPhotos(id);
  } catch (error) {
    console.error("getProjectWithPhotos error:", error);
    notFound();
  }

  try {
    postedDates = await getProjectPostedDates(id);
  } catch (error) {
    console.error("getProjectPostedDates error:", error);
    postedDates = [];
  }

  const status = project.status as ProjectStatus;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  // 最初の写真をサムネイルとして使用
  const thumbnailUrl = project.photos.length > 0 ? project.photos[0].photoUrl : null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* パンくずリスト */}
      <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
        <Link
          href="/projects"
          className="hover:text-primary transition-colors"
        >
          案件一覧
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-900 dark:text-white">{project.name}</span>
      </nav>

      {/* プロジェクトバナー */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex items-start gap-6">
          {/* サムネイル画像 */}
          <div className="w-32 h-32 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
            {thumbnailUrl ? (
              <LazyImage
                src={thumbnailUrl}
                alt={project.name}
                fill
                className="object-cover"
                containerClassName="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                <FileText className="size-10" />
              </div>
            )}
          </div>

          {/* プロジェクト情報 */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                {project.name}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                  statusConfig.bgColor,
                  statusConfig.textColor
                )}
              >
                {statusConfig.label}
              </span>
            </div>

            {project.location && (
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="size-4" />
                {project.location}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2">
              <div className="text-sm text-slate-500">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  作成日:
                </span>{" "}
                {format(new Date(project.createdAt), "yyyy年M月d日", {
                  locale: ja,
                })}
              </div>
              <div className="text-sm text-slate-500">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  写真数:
                </span>{" "}
                {project.photos.length}枚
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <ProjectStatusToggle projectId={id} currentStatus={status} />
          <ProjectDeleteButton projectId={id} projectName={project.name} />
        </div>
      </div>

      {/* タブ切り替え */}
      <Tabs defaultValue="by-date" className="w-full">
        <div className="border-b border-slate-200 dark:border-slate-800">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            <TabsTrigger
              value="by-date"
              className="px-1 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-medium data-[state=active]:font-bold transition-colors flex items-center gap-2"
            >
              <Calendar className="size-4" />
              日付別
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="px-1 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-medium data-[state=active]:font-bold transition-colors flex items-center gap-2"
            >
              <Camera className="size-4" />
              タイムライン
            </TabsTrigger>
          </TabsList>
        </div>

        {/* タブコンテンツ */}
        <div className="py-8">
          <TabsContent value="by-date" className="mt-0">
            <ReportDateList
              projectId={id}
              projectName={project.name}
              reports={project.reports}
              postedDates={postedDates}
            />
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <PhotoTimeline photos={project.photos} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ProjectDetailPage;
