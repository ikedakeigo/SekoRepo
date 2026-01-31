/**
 * 案件詳細（タイムライン）画面
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectWithPhotos, updateProjectStatus } from "@/actions/projects";
import { PhotoTimeline } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Camera, Calendar, Check } from "lucide-react";
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
  try {
    project = await getProjectWithPhotos(id);
  } catch {
    notFound();
  }

  const status = project.status as ProjectStatus;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  const markAsPosted = async () => {
    "use server";
    await updateProjectStatus(id, "posted");
  };

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

          {status !== "posted" && (
            <form action={markAsPosted} className="pt-4">
              <Button type="submit" variant="outline" className="w-full">
                <Check className="mr-2 h-4 w-4" />
                投稿済みにする
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* 写真タイムライン */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">写真タイムライン</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoTimeline photos={project.photos} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetailPage;
