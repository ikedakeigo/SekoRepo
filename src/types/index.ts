// ユーザー
export type UserRole = 'staff' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// 案件
export type ProjectStatus = 'active' | 'completed' | 'posted';

export interface Project {
  id: string;
  name: string;
  location?: string;
  description?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 写真
export type PhotoType = 'before' | 'during' | 'after' | 'other';

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  before: 'ビフォー',
  during: '作業中',
  after: 'アフター',
  other: 'その他',
};

export interface Photo {
  id: string;
  report_id: string;
  photo_url: string;
  photo_type: PhotoType;
  title: string;
  comment?: string;
  customer_feedback?: string;
  sort_order: number;
  taken_at?: string;
  created_at: string;
  updated_at: string;
}

// レポート
export interface Report {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// フォーム用
export interface PhotoFormData {
  file: File | null;
  previewUrl: string;
  photoType: PhotoType;
  title: string;
  comment: string;
  customerFeedback: string;
}
