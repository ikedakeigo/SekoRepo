/**
 * 案件関連のServer Actions
 */

"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "./auth";
import { deletePhoto } from "@/lib/supabase/storage";
import { revalidatePath } from "next/cache";
import type { ProjectStatus } from "@/types";

/**
 * 案件一覧を取得（統計情報付き）
 */
export const getProjects = async () => {
  await requireAuth();

  const projects = await prisma.project.findMany({
    include: {
      _count: {
        select: {
          reports: true,
        },
      },
      reports: {
        include: {
          _count: {
            select: {
              photos: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return projects.map((project) => ({
    ...project,
    reportCount: project._count.reports,
    photoCount: project.reports.reduce(
      (sum, report) => sum + report._count.photos,
      0
    ),
  }));
};

/**
 * アクティブな案件一覧を取得（ドロップダウン用）
 */
export const getActiveProjects = async () => {
  await requireAuth();

  const projects = await prisma.project.findMany({
    where: {
      status: "active",
    },
    select: {
      id: true,
      name: true,
      location: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return projects;
};

/**
 * 案件を作成
 */
export const createProject = async (data: {
  name: string;
  location?: string;
}) => {
  const userId = await requireAuth();

  const project = await prisma.project.create({
    data: {
      name: data.name,
      location: data.location,
      createdBy: userId,
    },
  });

  revalidatePath("/");
  revalidatePath("/projects");

  return project;
};

/**
 * 案件詳細を取得（写真含む）
 */
export const getProjectWithPhotos = async (projectId: string) => {
  await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      reports: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          photos: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!project) {
    throw new Error("案件が見つかりません");
  }

  // 写真をフラット化（reportIdを明示的にマッピング）
  const photos = project.reports.flatMap((report) =>
    report.photos.map((photo) => ({
      ...photo,
      reportId: report.id,
      user: report.user,
      reportCreatedAt: report.createdAt,
    }))
  );

  return {
    ...project,
    photos,
  };
};

/**
 * 案件ステータスを更新
 */
export const updateProjectStatus = async (
  projectId: string,
  status: ProjectStatus
) => {
  await requireAdmin();

  await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
};

/**
 * 案件を削除（ストレージ・関連レコードも含む）
 */
export const deleteProject = async (projectId: string) => {
  await requireAdmin();

  // 全レポート・写真URLを取得
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      reports: {
        include: {
          photos: {
            select: { photoUrl: true },
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error("案件が見つかりません");
  }

  // ストレージから写真を削除
  const allPhotoUrls = project.reports.flatMap((report) =>
    report.photos.map((photo) => photo.photoUrl)
  );

  const deletePromises = allPhotoUrls.map(async (photoUrl) => {
    try {
      await deletePhoto(photoUrl);
    } catch (error) {
      console.error(`Failed to delete photo: ${photoUrl}`, error);
      // ストレージ削除に失敗してもDB削除は続行
    }
  });
  await Promise.all(deletePromises);

  // ProjectPostedDateを削除（カスケードなしのため手動削除）
  await prisma.projectPostedDate.deleteMany({
    where: { projectId },
  });

  // DB削除（カスケードでreports→photosも削除される）
  await prisma.project.delete({
    where: { id: projectId },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
};

/**
 * 案件の投稿済み日付一覧を取得
 */
export const getProjectPostedDates = async (projectId: string) => {
  await requireAuth();

  const postedDates = await prisma.projectPostedDate.findMany({
    where: { projectId },
    select: { date: true },
  });

  // 日付文字列の配列として返す（YYYY-MM-DD形式）
  return postedDates.map((pd) => {
    const d = new Date(pd.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
};

/**
 * 日付の投稿済みステータスをトグル
 */
export const toggleDatePostedStatus = async (
  projectId: string,
  dateString: string // YYYY-MM-DD形式
) => {
  await requireAdmin();

  // 日付文字列をDateオブジェクトに変換（UTC）
  const date = new Date(dateString + "T00:00:00.000Z");

  // 既存レコードを検索
  const existing = await prisma.projectPostedDate.findUnique({
    where: {
      projectId_date: {
        projectId,
        date,
      },
    },
  });

  if (existing) {
    // 存在する場合は削除（投稿済み解除）
    await prisma.projectPostedDate.delete({
      where: { id: existing.id },
    });
  } else {
    // 存在しない場合は作成（投稿済みにする）
    await prisma.projectPostedDate.create({
      data: {
        projectId,
        date,
      },
    });
  }

  revalidatePath(`/projects/${projectId}`);
};
