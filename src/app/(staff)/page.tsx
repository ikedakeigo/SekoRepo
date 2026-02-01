/**
 * 現場スタッフ用ホーム画面
 */

import Link from "next/link";
import { getCurrentUser } from "@/actions/auth";
import { getUserReports } from "@/actions/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

const HomePage = async () => {
  const user = await getCurrentUser();
  const recentReports = await getUserReports(5);

  return (
    <div className="p-4 space-y-6">
      {/* ウェルカムメッセージ */}
      <div className="text-center py-4">
        <h1 className="text-xl font-bold">
          こんにちは、{user?.name || "ゲスト"}さん
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          今日も現場作業お疲れ様です
        </p>
      </div>

      {/* レポート送信ボタン */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <Link href="/report/new">
            <Button
              variant="secondary"
              size="lg"
              className="w-full h-20 text-lg"
            >
              <Camera className="mr-3 h-6 w-6" />
              レポートを送信
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 最近の送信 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">最近の送信</CardTitle>
            <Link
              href="/history"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center"
            >
              すべて見る
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentReports.length > 0 ? (
            <div className="space-y-1">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/history/${report.id}`}
                  className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{report.projectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.createdAt), {
                        addSuffix: true,
                        locale: ja,
                      })}
                      {" | "}
                      写真{report.photoCount}枚
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              まだ送信履歴がありません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
