/**
 * CSVダウンロードボタンコンポーネント
 * 案件データをCSV形式でダウンロード
 */

"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { exportProjectToCSV } from "@/actions/export";
import { toast } from "sonner";
import { format } from "date-fns";

interface CSVDownloadButtonProps {
  projectId: string;
  projectName: string;
}

/**
 * CSVダウンロードボタン
 */
export const CSVDownloadButton = ({
  projectId,
  projectName,
}: CSVDownloadButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleDownload = () => {
    startTransition(async () => {
      try {
        const csvData = await exportProjectToCSV(projectId);

        // Blobを作成
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

        // ダウンロードリンクを作成
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // ファイル名を生成（案件名_レポート_YYYYMMDD.csv）
        const dateStr = format(new Date(), "yyyyMMdd");
        const fileName = `${projectName}_レポート_${dateStr}.csv`;
        link.download = fileName;

        // ダウンロード実行
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("CSVファイルをダウンロードしました");
      } catch (error) {
        console.error("CSV download error:", error);
        toast.error("ダウンロードに失敗しました");
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleDownload}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ダウンロード中...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          CSVダウンロード
        </>
      )}
    </Button>
  );
};
