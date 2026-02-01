/**
 * レポート関連のServer Actions
 */

"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth";
import { uploadPhoto } from "@/lib/supabase/storage";
import { revalidatePath } from "next/cache";
import type { PhotoFormData, PhotoType } from "@/types";
import type { UpdatePhotoSchemaType } from "@/lib/validations/report";

/**
 * レポートを作成（写真アップロード含む）
 */
export const createReport = async (data: {
  projectId: string;
  photos: PhotoFormData[];
}) => {
  const userId = await requireAuth();

  // トランザクションで実行
  const report = await prisma.$transaction(async (tx) => {
    // 1. レポート作成
    const newReport = await tx.report.create({
      data: {
        projectId: data.projectId,
        userId: userId,
      },
    });

    // 2. 写真をアップロード＆レコード作成
    const photoPromises = data.photos.map(async (photo, index) => {
      if (!photo.file) {
        throw new Error("写真ファイルが必要です");
      }

      // Storage にアップロード
      const photoUrl = await uploadPhoto(photo.file, newReport.id);

      // DB にレコード作成
      return tx.photo.create({
        data: {
          reportId: newReport.id,
          photoUrl,
          photoType: photo.photoType,
          title: photo.title,
          comment: photo.comment || null,
          customerFeedback: photo.customerFeedback || null,
          sortOrder: index,
        },
      });
    });

    await Promise.all(photoPromises);

    return newReport;
  });

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${data.projectId}`);

  return report;
};

/**
 * ユーザーの送信履歴を取得
 */
export const getUserReports = async (limit = 10) => {
  const userId = await requireAuth();

  const reports = await prisma.report.findMany({
    where: { userId },
    include: {
      project: {
        select: { id: true, name: true },
      },
      _count: {
        select: { photos: true },
      },
      photos: {
        select: { photoUrl: true },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return reports.map((report) => ({
    id: report.id,
    projectId: report.projectId,
    projectName: report.project.name,
    photoCount: report._count.photos,
    thumbnailUrl: report.photos[0]?.photoUrl || null,
    createdAt: report.createdAt,
  }));
};

/**
 * 新着レポートを取得（管理者用）
 */
export const getRecentReports = async (limit = 20) => {
  await requireAuth();

  const reports = await prisma.report.findMany({
    include: {
      project: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true, name: true },
      },
      photos: {
        select: { id: true, photoUrl: true, photoType: true },
        take: 4,
      },
      _count: {
        select: { photos: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return reports;
};

/**
 * ダッシュボード統計を取得
 */
export const getDashboardStats = async () => {
  await requireAuth();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalPhotos,
    weeklyPhotos,
    activeProjects,
    pendingProjects,
  ] = await Promise.all([
    prisma.photo.count(),
    prisma.photo.count({
      where: {
        createdAt: {
          gte: weekAgo,
        },
      },
    }),
    prisma.project.count({
      where: { status: "active" },
    }),
    prisma.project.count({
      where: {
        status: { in: ["active", "completed"] },
      },
    }),
  ]);

  return {
    totalPhotos,
    weeklyPhotos,
    activeProjects,
    pendingProjects,
  };
};

/**
 * レポート詳細を取得（所有権チェック付き）
 */
export const getReportById = async (reportId: string) => {
  const userId = await requireAuth();

  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      userId: userId,
    },
    include: {
      project: {
        select: { id: true, name: true, location: true },
      },
      photos: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!report) {
    return null;
  }

  return {
    id: report.id,
    projectId: report.projectId,
    projectName: report.project.name,
    projectLocation: report.project.location,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    photos: report.photos.map((photo) => ({
      id: photo.id,
      photoUrl: photo.photoUrl,
      photoType: photo.photoType as PhotoType,
      title: photo.title,
      comment: photo.comment,
      customerFeedback: photo.customerFeedback,
      sortOrder: photo.sortOrder,
    })),
  };
};

/**
 * レポートの写真情報を更新
 */
export const updateReportPhotos = async (
  reportId: string,
  photos: UpdatePhotoSchemaType[]
) => {
  const userId = await requireAuth();

  // 所有権確認
  const report = await prisma.report.findFirst({
    where: { id: reportId, userId: userId },
  });

  if (!report) {
    throw new Error("レポートが見つかりません");
  }

  // トランザクションで全写真を更新
  await prisma.$transaction(
    photos.map((photo) =>
      prisma.photo.update({
        where: {
          id: photo.id,
          reportId: reportId,
        },
        data: {
          title: photo.title,
          comment: photo.comment || null,
          customerFeedback: photo.customerFeedback || null,
        },
      })
    )
  );

  revalidatePath(`/history/${reportId}`);
  revalidatePath("/history");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${report.projectId}`);

  return { success: true };
};
