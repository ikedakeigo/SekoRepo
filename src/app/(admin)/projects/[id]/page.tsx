interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">案件詳細</h1>
      <p>案件ID: {id}</p>
    </div>
  );
}
