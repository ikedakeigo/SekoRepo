/**
 * 案件一覧画面
 */

import { getProjects } from "@/actions/projects";
import { ProjectCard, AddProjectCard } from "@/components/admin";
import { ProjectsHeader } from "@/components/admin/projects-header";
import { FolderOpen } from "lucide-react";

const ProjectsPage = async () => {
  const projects = await getProjects();

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* ヘッダー */}
      <ProjectsHeader projectCount={projects.length} />

      {/* プロジェクトグリッド */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          <AddProjectCard />
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
        </div>
      )}

      {/* ページネーション（将来実装） */}
      {projects.length > 0 && (
        <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {projects.length}件の案件を表示中
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
