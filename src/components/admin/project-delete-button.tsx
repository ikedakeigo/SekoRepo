/**
 * 案件削除ボタンコンポーネント
 * AlertDialogで確認後、案件を削除する
 */

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProject } from "@/actions/projects";
import { toast } from "sonner";

interface ProjectDeleteButtonProps {
  projectId: string;
  projectName: string;
}

export const ProjectDeleteButton = ({
  projectId,
  projectName,
}: ProjectDeleteButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteProject(projectId);
        toast.success("案件を削除しました");
        router.push("/projects");
      } catch (error) {
        toast.error("削除に失敗しました");
        console.error("Delete project failed:", error);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              削除中...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              案件を削除
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>案件を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{projectName}」を削除します。
            この案件に含まれる全てのレポートと写真も削除されます。
            この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "削除中..." : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
