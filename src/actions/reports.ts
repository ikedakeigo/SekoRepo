/**
 * レポート関連のServer Actions
 */

"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "./auth";
import { uploadPhoto, deletePhoto } from "@/lib/supabase/storage";
import { revalidatePath } from "next/cache";
import type { PhotoType } from "@/types";
import type { UpdatePhotoSchemaType } from "@/lib/validations/report";

/** 写真メタデータの型 */
interface PhotoMetadata {
  photoType: string;
  title: string;
  comment: string;
  customerFeedback: string;
}

/** 写真データの型（URL付き） */
interface PhotoWithUrl {
  photoUrl: string;
  photoType: string;
  title: string;
  comment: string;
  customerFeedback: string;
}

/**
 * レポートを作成（写真アップロード含む）
 * FormDataを受け取り、ファイルとメタデータを処理
 */
export const createReport = async (formData: FormData) => {
  const userId = await requireAuth();

  // FormDataからデータを抽出
  const projectId = formData.get("projectId") as string;
  const summary = formData.get("summary") as string;
  const photosMetadataJson = formData.get("photosMetadata") as string;

  if (!projectId) {
    throw new Error("案件IDが必要です");
  }

  const photosMetadata: PhotoMetadata[] = JSON.parse(photosMetadataJson || "[]");

  // 写真ファイルを取得
  const photoFiles: File[] = [];
  for (let i = 0; i < photosMetadata.length; i++) {
    const file = formData.get(`photo_${i}`) as File | null;
    if (file) {
      photoFiles.push(file);
    }
  }

  if (photoFiles.length === 0) {
    throw new Error("写真が必要です");
  }

  // トランザクションで実行
  const report = await prisma.$transaction(async (tx) => {
    // 1. レポート作成
    const newReport = await tx.report.create({
      data: {
        projectId: projectId,
        userId: userId,
        summary: summary || null,
      },
    });

    // 2. 写真をアップロード＆レコード作成
    const photoPromises = photoFiles.map(async (file, index) => {
      const metadata = photosMetadata[index];

      // Storage にアップロード
      const photoUrl = await uploadPhoto(file, newReport.id);

      // DB にレコード作成
      return tx.photo.create({
        data: {
          reportId: newReport.id,
          photoUrl,
          photoType: metadata.photoType,
          title: metadata.title,
          comment: metadata.comment || null,
          customerFeedback: metadata.customerFeedback || null,
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
  revalidatePath(`/projects/${projectId}`);

  return report;
};

/**
 * レポートを作成（URLベース - クライアント直接アップロード用）
 * 写真は事前にクライアントからSupabase Storageにアップロード済み
 */
export const createReportWithUrls = async (data: {
  projectId: string;
  summary: string;
  photos: PhotoWithUrl[];
}) => {
  const userId = await requireAuth();

  const { projectId, summary, photos } = data;

  if (!projectId) {
    throw new Error("案件IDが必要です");
  }

  if (photos.length === 0) {
    throw new Error("写真が必要です");
  }

  // レポートと写真を作成
  const report = await prisma.report.create({
    data: {
      projectId,
      userId,
      summary: summary || null,
      photos: {
        create: photos.map((photo, index) => ({
          photoUrl: photo.photoUrl,
          photoType: photo.photoType,
          title: photo.title,
          comment: photo.comment || null,
          customerFeedback: photo.customerFeedback || null,
          sortOrder: index,
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);

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
    summary: report.summary,
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

/**
 * レポートに写真を追加
 * FormDataを受け取り、ファイルとメタデータを処理
 */
export const addPhotosToReport = async (formData: FormData) => {
  const userId = await requireAuth();

  const reportId = formData.get("reportId") as string;
  const photosMetadataJson = formData.get("photosMetadata") as string;

  if (!reportId) {
    throw new Error("レポートIDが必要です");
  }

  const photosMetadata: PhotoMetadata[] = JSON.parse(photosMetadataJson || "[]");

  // 写真ファイルを取得
  const photoFiles: File[] = [];
  for (let i = 0; i < photosMetadata.length; i++) {
    const file = formData.get(`photo_${i}`) as File | null;
    if (file) {
      photoFiles.push(file);
    }
  }

  if (photoFiles.length === 0) {
    throw new Error("写真が必要です");
  }

  // 所有権確認
  const report = await prisma.report.findFirst({
    where: { id: reportId, userId: userId },
    include: {
      _count: { select: { photos: true } },
    },
  });

  if (!report) {
    throw new Error("レポートが見つかりません");
  }

  // 現在の写真数を取得して、sortOrderを計算
  const startSortOrder = report._count.photos;

  // トランザクションで写真を追加
  await prisma.$transaction(async (tx) => {
    const photoPromises = photoFiles.map(async (file, index) => {
      const metadata = photosMetadata[index];

      // Storage にアップロード
      const photoUrl = await uploadPhoto(file, reportId);

      // DB にレコード作成
      return tx.photo.create({
        data: {
          reportId: reportId,
          photoUrl,
          photoType: metadata.photoType,
          title: metadata.title,
          comment: metadata.comment || null,
          customerFeedback: metadata.customerFeedback || null,
          sortOrder: startSortOrder + index,
        },
      });
    });

    await Promise.all(photoPromises);
  });

  revalidatePath(`/history/${reportId}`);
  revalidatePath("/history");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${report.projectId}`);

  return { success: true };
};

/**
 * レポートの全体コメントを更新
 */
export const updateReportSummary = async (
  reportId: string,
  summary: string
) => {
  const userId = await requireAuth();

  // 所有権確認
  const report = await prisma.report.findFirst({
    where: { id: reportId, userId: userId },
  });

  if (!report) {
    throw new Error("レポートが見つかりません");
  }

  await prisma.report.update({
    where: { id: reportId },
    data: { summary: summary.trim() || null },
  });

  revalidatePath(`/history/${reportId}`);
  revalidatePath("/history");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${report.projectId}`);

  return { success: true };
};

/**
 * 写真を1枚削除（管理者専用）
 * ストレージとDBから削除。レポートの最後の1枚の場合はレポートごと削除。
 */
export const deleteSinglePhoto = async (photoId: string) => {
  await requireAdmin();

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { report: true },
  });

  if (!photo) {
    throw new Error("写真が見つかりません");
  }

  const projectId = photo.report.projectId;
  const reportId = photo.reportId;

  // ストレージから削除
  try {
    await deletePhoto(photo.photoUrl);
  } catch (error) {
    console.error(`Failed to delete photo from storage: ${photo.photoUrl}`, error);
  }

  // 常に写真を先に削除
  await prisma.photo.delete({
    where: { id: photoId },
  });

  // 空になったレポートを削除（競合状態に強い: 削除後のカウントで判定）
  const remainingPhotos = await prisma.photo.count({
    where: { reportId },
  });

  if (remainingPhotos === 0) {
    await prisma.report.delete({
      where: { id: reportId },
    });
  }

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);

  return { success: true };
};

/**
 * レポートを削除（管理者専用）
 * レポートに紐づく写真もストレージから削除
 */
export const deleteReport = async (reportId: string) => {
  await requireAdmin();

  // レポートと写真を取得
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      photos: {
        select: { photoUrl: true },
      },
    },
  });

  if (!report) {
    throw new Error("レポートが見つかりません");
  }

  const projectId = report.projectId;

  // ストレージから写真を削除
  const deletePromises = report.photos.map(async (photo) => {
    try {
      await deletePhoto(photo.photoUrl);
    } catch (error) {
      console.error(`Failed to delete photo: ${photo.photoUrl}`, error);
      // ストレージ削除に失敗してもDB削除は続行
    }
  });
  await Promise.all(deletePromises);

  // DBからレポートを削除（カスケードで写真も削除される）
  await prisma.report.delete({
    where: { id: reportId },
  });

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);

  return { success: true };
};
