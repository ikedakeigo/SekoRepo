/**
 * 写真カードコンポーネント
 * タイムラインに表示する写真カード
 */

"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface PhotoCardProps {
  photo: {
    id: string;
    photoUrl: string;
    title: string;
    comment?: string | null;
    customerFeedback?: string | null;
    createdAt: Date;
    user?: {
      name: string;
    };
    reportCreatedAt?: Date;
  };
}

/**
 * 写真カード
 */
export const PhotoCard = ({ photo }: PhotoCardProps) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(photo.photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${photo.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* 写真 */}
          <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={photo.photoUrl}
              alt={photo.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* 情報 */}
          <div className="flex-1 min-w-0 space-y-2">
            <h4 className="font-medium text-sm">{photo.title}</h4>

            {photo.comment && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {photo.comment}
              </p>
            )}

            {photo.customerFeedback && (
              <div className="flex items-start gap-2 p-2 bg-green-50 rounded-md">
                <MessageSquare className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 line-clamp-2">
                  {photo.customerFeedback}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {photo.user && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {photo.user.name}
                  </span>
                )}
                <span>
                  {format(
                    new Date(photo.reportCreatedAt || photo.createdAt),
                    "M/d HH:mm",
                    { locale: ja }
                  )}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                DL
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
