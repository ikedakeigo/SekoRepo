/**
 * レポート詳細ページ
 */

import { notFound } from "next/navigation";
import { getReportById } from "@/actions/reports";
import { ReportDetailView } from "@/components/staff/report-detail-view";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

const ReportDetailPage = async ({ params }: ReportDetailPageProps) => {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  return <ReportDetailView report={report} />;
};

export default ReportDetailPage;
