/**
 * レポート入力画面
 */

import { getActiveProjects } from "@/actions/projects";
import { getCurrentUser } from "@/actions/auth";
import { ReportForm } from "@/components/report";
import { redirect } from "next/navigation";

const NewReportPage = async () => {
  const [projects, user] = await Promise.all([
    getActiveProjects(),
    getCurrentUser(),
  ]);

  if (!user) {
    redirect("/login");
  }

  return <ReportForm projects={projects} userId={user.id} />;
};

export default NewReportPage;
