/**
 * ダッシュボード画面
 */

import Link from "next/link";
import Image from "next/image";
import { getDashboardStats, getRecentReports } from "@/actions/reports";
import { StatsCards } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Camera } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

const DashboardPage = async () => {
  const [stats, recentReports] = await Promise.all([
    getDashboardStats(),
    getRecentReports(10),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {/* 統計カード */}
      <StatsCards stats={stats} />

      {/* 新着レポート */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">新着レポート</CardTitle>
            <Link
              href="/projects"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center"
            >
              案件一覧へ
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentReports.length > 0 ? (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/projects/${report.project.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    {/* サムネイル */}
                    <div className="flex -space-x-2">
                      {report.photos.slice(0, 3).map((photo, i) => (
                        <div
                          key={photo.id}
                          className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-background"
                          style={{ zIndex: 3 - i }}
                        >
                          <Image
                            src={photo.photoUrl}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                      {report.photos.length === 0 && (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* 情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {report.project.name}
                        </p>
                        {new Date(report.createdAt).getTime() >
                          Date.now() - 24 * 60 * 60 * 1000 && (
                          <Badge variant="destructive" className="text-xs">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {report.user.name} |{" "}
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                          locale: ja,
                        })}{" "}
                        | 写真{report._count.photos}枚
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              まだレポートがありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
