# CLAUDE.md - SekoRepo

## プロジェクト概要

施工レポート収集・管理アプリケーション「SekoRepo」の開発プロジェクト。

屋根工事・建設業の現場スタッフが撮影した写真とコメントを収集・管理し、Instagram投稿用コンテンツの作成を効率化する。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIライブラリ**: shadcn/ui
- **認証**: Supabase Auth
- **データベース**: Supabase (PostgreSQL)
- **ストレージ**: Supabase Storage
- **ホスティング**: Vercel
- **パッケージマネージャー**: pnpm

## ディレクトリ構成

```
genba-memo/
├── app/                      # App Router
│   ├── (auth)/              # 認証関連（グループ）
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (staff)/             # 現場スタッフ用（グループ）
│   │   ├── page.tsx         # ホーム
│   │   ├── report/new/      # レポート入力
│   │   ├── history/         # 履歴
│   │   └── layout.tsx
│   ├── (admin)/             # 投稿担当者用（グループ）
│   │   ├── dashboard/
│   │   ├── projects/
│   │   │   └── [id]/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # shadcn/ui コンポーネント
│   ├── report/              # レポート関連
│   ├── admin/               # 管理者画面関連
│   └── shared/              # 共通コンポーネント
├── lib/
│   ├── supabase/            # Supabase クライアント
│   └── utils.ts
├── actions/                 # Server Actions
├── types/                   # 型定義
├── hooks/                   # カスタムフック
└── middleware.ts            # 認証ミドルウェア
```

## コーディング規約

### ファイル命名

- コンポーネント: `kebab-case.tsx` (例: `photo-detail-card.tsx`)
- ユーティリティ: `kebab-case.ts` (例: `format-date.ts`)
- 型定義: `index.ts` (types/index.ts に集約)

### コンポーネント

- React Server Components をデフォルトで使用
- クライアントコンポーネントは `'use client'` を明示
- Props の型は interface で定義
- コンポーネントは named export を使用

```typescript
// 良い例
"use client";

interface PhotoCardProps {
  photo: Photo;
  onDelete?: () => void;
}

export function PhotoCard({ photo, onDelete }: PhotoCardProps) {
  // ...
}
```

### Server Actions

- `actions/` ディレクトリに配置
- `'use server'` を先頭に記述
- エラーハンドリングを必ず実装
- revalidatePath で適切にキャッシュを更新

```typescript
// actions/reports.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createReport(data: CreateReportInput) {
  const supabase = await createClient();

  try {
    // 処理
    revalidatePath("/");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: "エラーが発生しました" };
  }
}
```

### スタイリング

- Tailwind CSS のユーティリティクラスを使用
- 複雑なスタイルは cn() ヘルパーで結合
- レスポンシブは モバイルファースト (sm:, md:, lg:)

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-blue-500',
  className
)}>
```

### 型定義

- `types/index.ts` に集約
- Supabase の型は自動生成を活用
- フォーム用の型は Zod スキーマから推論

```typescript
// types/index.ts
export type PhotoType = "before" | "during" | "after" | "other";

export interface Photo {
  id: string;
  photo_url: string;
  photo_type: PhotoType;
  title: string;
  comment?: string;
  // ...
}
```

## データベース構造

### テーブル

1. **users** - ユーザー情報
   - id, email, name, role ('staff' | 'admin')

2. **projects** - 案件（施工現場）
   - id, name, location, status, created_by

3. **reports** - レポート（1回の送信）
   - id, project_id, user_id

4. **photos** - 写真（個別）
   - id, report_id, photo_url, photo_type, title, comment, customer_feedback

### リレーション

```
users 1--N projects (created_by)
users 1--N reports (user_id)
projects 1--N reports
reports 1--N photos
```

## 主要機能

### 現場スタッフ機能

1. 写真一括アップロード（最大10枚）
2. 写真ごとの個別コメント入力
   - 種類（ビフォー/作業中/アフター/その他）
   - タイトル（必須）
   - コメント（任意）
   - お客様の反応（アフターのみ、任意）
3. 案件選択/新規作成
4. 送信履歴確認

### 投稿担当者機能

1. ダッシュボード（統計、新着レポート）
2. 案件一覧
3. 案件詳細（タイムライン表示）
4. 写真ダウンロード
5. ステータス管理

## 認証フロー

1. 未認証 → `/login` にリダイレクト
2. 認証後、ロールに応じてリダイレクト
   - staff → `/` (ホーム)
   - admin → `/dashboard`
3. admin専用ページへのアクセス制御（middleware）

## 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# 型チェック
pnpm type-check

# Lint
pnpm lint

# shadcn/ui コンポーネント追加
pnpm dlx shadcn@latest add [component-name]
```

## 注意事項

### 画像アップロード

- 最大ファイルサイズ: 10MB
- 対応形式: JPEG, PNG, WebP
- アップロード先: Supabase Storage の `photos` バケット
- ファイル名: `{report_id}/{timestamp}-{random}.{ext}`

### セキュリティ

- RLS (Row Level Security) を有効化
- 認証ユーザーのみアクセス可能
- 画像URLは署名付きURLを使用

### パフォーマンス

- 画像はクライアント側で圧縮してからアップロード
- 一覧表示ではサムネイルを使用
- Server Components でデータフェッチ

## 今後の拡張予定

- [ ] PWA対応（ホーム画面に追加）
- [ ] プッシュ通知（新着レポート）
- [ ] AI投稿文生成（Claude API）
- [ ] 写真の編集機能
