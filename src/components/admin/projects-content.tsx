/**
 * 案件一覧コンテンツコンポーネント
 * 検索・フィルター・案件作成を管理するクライアントラッパー
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProjectCard, AddProjectCard } from "@/components/admin/project-card";
import {
  ProjectsHeader,
  type FilterStatus,
} from "@/components/admin/projects-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/actions/projects";

interface ProjectItem {
  id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  status: string;
  createdAt: Date;
  reportCount: number;
  photoCount: number;
  thumbnailUrl?: string | null;
}

interface ProjectsContentProps {
  projects: ProjectItem[];
}

export const ProjectsContent = ({ projects }: ProjectsContentProps) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // ステータスフィルター
      if (activeFilter !== "all" && project.status !== activeFilter) {
        return false;
      }

      // 検索フィルター
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(query);
        const matchesLocation = project.location
          ?.toLowerCase()
          .includes(query);
        const matchesDescription = project.description
          ?.toLowerCase()
          .includes(query);
        if (!matchesName && !matchesLocation && !matchesDescription) {
          return false;
        }
      }

      return true;
    });
  }, [projects, searchQuery, activeFilter]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    setIsCreating(true);
    try {
      await createProject({
        name: projectName.trim(),
        location: projectLocation.trim() || undefined,
      });
      toast.success("案件を作成しました");
      setDialogOpen(false);
      setProjectName("");
      setProjectLocation("");
      router.refresh();
    } catch {
      toast.error("案件の作成に失敗しました");
    } finally {
      setIsCreating(false);
    }
  };

  const openCreateDialog = () => {
    setProjectName("");
    setProjectLocation("");
    setDialogOpen(true);
  };

  return (
    <>
      <ProjectsHeader
        projectCount={projects.length}
        filteredCount={filteredProjects.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onCreateProject={openCreateDialog}
      />

      {/* プロジェクトグリッド */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          <AddProjectCard onClick={openCreateDialog} />
        </div>
      ) : projects.length > 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <FolderOpen className="size-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            条件に一致する案件がありません
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            検索条件やフィルターを変更してください
          </p>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <FolderOpen className="size-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            まだ案件がありません
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            最初の案件を作成してください
          </p>
          <Button onClick={openCreateDialog} className="mt-4">
            案件を作成
          </Button>
        </div>
      )}

      {/* フッター */}
      {projects.length > 0 && (
        <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredProjects.length === projects.length
              ? `${projects.length}件の案件を表示中`
              : `${filteredProjects.length}件 / ${projects.length}件を表示中`}
          </p>
        </div>
      )}

      {/* 案件作成ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新規案件を作成</DialogTitle>
            <DialogDescription>
              新しい施工現場を登録します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">案件名 *</Label>
              <Input
                id="project-name"
                placeholder="例: ○○邸 屋根工事"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-location">場所</Label>
              <Input
                id="project-location"
                placeholder="例: 東京都渋谷区"
                value={projectLocation}
                onChange={(e) => setProjectLocation(e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isCreating}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || isCreating}
            >
              {isCreating && <Loader2 className="size-4 mr-2 animate-spin" />}
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
