/**
 * 案件カードコンポーネント
 * 案件一覧に表示するカード
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { ProjectStatus } from "@/types";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    location?: string | null;
    status: string;
    createdAt: Date;
    reportCount: number;
    photoCount: number;
  };
}

/** ステータスのラベルと色 */
const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  active: { label: "進行中", variant: "default" },
  completed: { label: "完了", variant: "secondary" },
  posted: { label: "投稿済", variant: "outline" },
};

/**
 * 案件カード
 */
export const ProjectCard = ({ project }: ProjectCardProps) => {
  const status = project.status as ProjectStatus;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{project.name}</CardTitle>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {project.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {project.location}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              {project.photoCount}枚
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {project.reportCount}件
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            作成:{" "}
            {formatDistanceToNow(new Date(project.createdAt), {
              addSuffix: true,
              locale: ja,
            })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
