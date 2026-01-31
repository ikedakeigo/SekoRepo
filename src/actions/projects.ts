/**
 * 案件関連のServer Actions
 */

"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "./auth";
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

  // 写真をフラット化
  const photos = project.reports.flatMap((report) =>
    report.photos.map((photo) => ({
      ...photo,
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
 * 案件を削除
 */
export const deleteProject = async (projectId: string) => {
  await requireAdmin();

  await prisma.project.delete({
    where: { id: projectId },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
};
