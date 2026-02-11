/**
 * 案件ステータス切り替えコンポーネント
 * ローディング状態を表示するためのクライアントコンポーネント
 */

"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, RotateCcw, Loader2 } from "lucide-react";
import { updateProjectStatus } from "@/actions/projects";
import type { ProjectStatus } from "@/types";

interface ProjectStatusToggleProps {
  projectId: string;
  currentStatus: ProjectStatus;
}

/**
 * 案件ステータス切り替えボタン
 */
export const ProjectStatusToggle = ({
  projectId,
  currentStatus,
}: ProjectStatusToggleProps) => {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newStatus = currentStatus === "completed" ? "active" : "completed";
    startTransition(async () => {
      await updateProjectStatus(projectId, newStatus);
    });
  };

  if (currentStatus === "posted") {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="whitespace-nowrap"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          更新中...
        </>
      ) : currentStatus === "active" ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          施工完了にする
        </>
      ) : (
        <>
          <RotateCcw className="mr-2 h-4 w-4" />
          進行中に戻す
        </>
      )}
    </Button>
  );
};
