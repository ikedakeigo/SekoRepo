/**
 * レポート入力画面
 */

import { getActiveProjects } from "@/actions/projects";
import { ReportForm } from "@/components/report";

const NewReportPage = async () => {
  const projects = await getActiveProjects();

  return <ReportForm projects={projects} />;
};

export default NewReportPage;
