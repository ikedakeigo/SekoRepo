/**
 * 案件選択コンポーネント
 * 既存案件の選択または新規作成
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { createProject } from "@/actions/projects";

interface Project {
  id: string;
  name: string;
  location?: string | null;
}

interface ProjectSelectorProps {
  projects: Project[];
  value: string;
  onChange: (projectId: string) => void;
  onProjectCreated?: (project: Project) => void;
  error?: string;
}

/**
 * 案件選択
 */
export const ProjectSelector = ({
  projects,
  value,
  onChange,
  onProjectCreated,
  error,
}: ProjectSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLocation, setNewProjectLocation] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setCreateError("案件名を入力してください");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const project = await createProject({
        name: newProjectName.trim(),
        location: newProjectLocation.trim() || undefined,
      });

      onChange(project.id);
      onProjectCreated?.({
        id: project.id,
        name: project.name,
        location: project.location,
      });

      setIsOpen(false);
      setNewProjectName("");
      setNewProjectLocation("");
    } catch {
      setCreateError("案件の作成に失敗しました");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        案件 <span className="text-red-500">*</span>
      </Label>

      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="案件を選択" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
                {project.location && (
                  <span className="text-muted-foreground ml-2">
                    ({project.location})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しい案件を作成</DialogTitle>
              <DialogDescription>
                新しい案件（施工現場）を作成します
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {createError && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {createError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="project-name">
                  案件名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="project-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="例: F様邸"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-location">場所</Label>
                <Input
                  id="project-location"
                  value={newProjectLocation}
                  onChange={(e) => setNewProjectLocation(e.target.value)}
                  placeholder="例: 兵庫県三木市"
                  maxLength={200}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isCreating}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleCreateProject}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    作成中...
                  </>
                ) : (
                  "作成"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
