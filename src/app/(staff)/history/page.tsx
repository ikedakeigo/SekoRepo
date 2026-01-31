/**
 * 送信履歴画面
 */

import Image from "next/image";
import { getUserReports } from "@/actions/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const HistoryPage = async () => {
  const reports = await getUserReports(50);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">送信履歴</h1>

      {reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* サムネイル */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {report.thumbnailUrl ? (
                      <Image
                        src={report.thumbnailUrl}
                        alt={report.projectName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {report.projectName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      写真 {report.photoCount}枚
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(report.createdAt), "yyyy年M月d日 HH:mm", {
                        locale: ja,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">まだ送信履歴がありません</p>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
