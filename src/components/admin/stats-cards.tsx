/**
 * 統計カードコンポーネント
 * ダッシュボードに表示する統計情報
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, FolderOpen, Clock } from "lucide-react";

interface StatsCardsProps {
  stats: {
    weeklyPhotos: number;
    activeProjects: number;
    pendingProjects: number;
  };
}

/**
 * 統計カード
 */
export const StatsCards = ({ stats }: StatsCardsProps) => {
  const cards = [
    {
      title: "今週の写真",
      value: stats.weeklyPhotos,
      icon: Camera,
      description: "直近7日間",
    },
    {
      title: "アクティブ案件",
      value: stats.activeProjects,
      icon: FolderOpen,
      description: "進行中",
    },
    {
      title: "未投稿",
      value: stats.pendingProjects,
      icon: Clock,
      description: "投稿待ち",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
