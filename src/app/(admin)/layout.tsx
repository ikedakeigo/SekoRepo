export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">SekoRepo 管理画面</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
