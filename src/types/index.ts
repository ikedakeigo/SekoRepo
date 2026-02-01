/**
 * 型定義ファイル
 * アプリケーション全体で使用する型を定義
 */

// ============================================
// ユーザー関連
// ============================================

/** ユーザーロール */
export type UserRole = "staff" | "admin";

/** ユーザー */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// 案件関連
// ============================================

/** 案件ステータス */
export type ProjectStatus = "active" | "completed" | "posted";

/** 案件 */
export interface Project {
  id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  status: ProjectStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 案件（統計情報付き） */
export interface ProjectWithStats extends Project {
  photoCount: number;
  reportCount: number;
}

// ============================================
// 写真関連
// ============================================

/** 写真の種類 */
export type PhotoType = "before" | "during" | "after" | "other";

/** 写真種類のラベル */
export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  before: "ビフォー",
  during: "作業中",
  after: "アフター",
  other: "その他",
};

/** 写真 */
export interface Photo {
  id: string;
  reportId: string;
  photoUrl: string;
  photoType: PhotoType;
  title: string;
  comment?: string | null;
  customerFeedback?: string | null;
  sortOrder: number;
  takenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 写真（ユーザー情報付き） */
export interface PhotoWithUser extends Photo {
  user: User;
  reportCreatedAt: Date;
}

// ============================================
// レポート関連
// ============================================

/** レポート */
export interface Report {
  id: string;
  projectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** レポート（詳細情報付き） */
export interface ReportWithDetails extends Report {
  photos: Photo[];
  project: Project;
  user: User;
}

/** レポート（写真数付き） */
export interface ReportWithCount extends Report {
  photoCount: number;
  project: Pick<Project, "name">;
}

// ============================================
// フォーム用の型
// ============================================

/** 写真フォームデータ */
export interface PhotoFormData {
  file: File | null;
  previewUrl: string;
  photoType: PhotoType;
  title: string;
  comment: string;
  customerFeedback: string;
}

/** レポートフォームデータ */
export interface ReportFormData {
  projectId: string;
  newProjectName?: string;
  newProjectLocation?: string;
  photos: PhotoFormData[];
}

/** 案件作成データ */
export interface CreateProjectData {
  name: string;
  location?: string;
}

/** 写真編集データ（既存写真の更新用） */
export interface PhotoEditData {
  id: string;
  photoUrl: string;
  photoType: PhotoType;
  title: string;
  comment: string;
  customerFeedback: string;
}

/** レポート詳細データ */
export interface ReportDetail {
  id: string;
  projectId: string;
  projectName: string;
  projectLocation?: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: {
    id: string;
    photoUrl: string;
    photoType: PhotoType;
    title: string;
    comment?: string | null;
    customerFeedback?: string | null;
    sortOrder: number;
  }[];
}

// ============================================
// API レスポンス用
// ============================================

/** APIレスポンス */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/** アクション結果 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
