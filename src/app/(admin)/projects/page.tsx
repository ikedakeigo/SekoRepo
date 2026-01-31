/**
 * 案件一覧画面
 */

import { getProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/admin";
import { FolderOpen } from "lucide-react";

const ProjectsPage = async () => {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">案件一覧</h1>
        <span className="text-muted-foreground">{projects.length}件</span>
      </div>

      {projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">まだ案件がありません</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
