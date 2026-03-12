/**
 * 案件一覧画面
 */

import { getProjects } from "@/actions/projects";
import { ProjectsContent } from "@/components/admin/projects-content";

const ProjectsPage = async () => {
  const projects = await getProjects();

  return (
    <div className="max-w-7xl mx-auto w-full">
      <ProjectsContent projects={projects} />
    </div>
  );
};

export default ProjectsPage;
