/**
 * 案件詳細（タイムライン）画面
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectWithPhotos, getProjectPostedDates } from "@/actions/projects";
import { PhotoTimeline, ReportDateList, ProjectStatusToggle } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Camera, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { ProjectStatus } from "@/types";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

/** ステータス設定 */
const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  active: { label: "進行中", variant: "default" },
  completed: { label: "完了", variant: "secondary" },
  posted: { label: "投稿済", variant: "outline" },
};

const ProjectDetailPage = async ({
  params,
}: ProjectDetailPageProps) => {
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
    // 投稿済み日付の取得に失敗しても、空配列で続行
    postedDates = [];
  }

  const status = project.status as ProjectStatus;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </div>
      </div>

      {/* 案件情報 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">案件情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-4 md:grid-cols-3">
            {project.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {project.location}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4 text-muted-foreground" />
              {project.photos.length}枚
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {format(new Date(project.createdAt), "yyyy年M月d日", {
                locale: ja,
              })}
            </div>
          </div>

          {/* ステータス変更ボタン（トグル） */}
          <div className="pt-4">
            <ProjectStatusToggle projectId={id} currentStatus={status} />
          </div>
        </CardContent>
      </Card>

      {/* タブ切り替え：日付別 / タイムライン */}
      <Card>
        <Tabs defaultValue="by-date">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">写真・レポート</CardTitle>
              <TabsList>
                <TabsTrigger value="by-date">日付別</TabsTrigger>
                <TabsTrigger value="timeline">タイムライン</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="by-date" className="mt-0">
              <ReportDateList projectId={id} reports={project.reports} postedDates={postedDates} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-0">
              <PhotoTimeline photos={project.photos} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default ProjectDetailPage;
