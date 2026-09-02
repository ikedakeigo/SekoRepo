/**
 * Prisma Seedスクリプト
 * テストユーザーをSupabase AuthとPrisma DBに登録
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// Supabase Admin Client (Service Role Key必須)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: "staff" | "admin";
}

const seedUsers: SeedUser[] = [
  {
    email: "admin@example.com",
    password: "password123",
    name: "管理者テスト",
    role: "admin",
  },
  {
    email: "staff@example.com",
    password: "password123",
    name: "スタッフテスト",
    role: "staff",
  },
  // E2Eテスト用アカウント
  {
    email: "admin-test@example.com",
    password: "testpass1",
    name: "テスト管理者",
    role: "admin",
  },
  {
    email: "staff-test@example.com",
    password: "testpass1",
    name: "テストスタッフ",
    role: "staff",
  },
];

async function createUser(userData: SeedUser) {
  const { email, password, name, role } = userData;

  // 既存ユーザーをチェック（Prisma側）
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`✓ User already exists: ${email}`);
    return existingUser;
  }

  // Supabase Authにユーザーを作成
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認をスキップ
    });

  if (authError) {
    // 既にAuthに存在する場合は取得を試みる
    if (authError.message.includes("already been registered")) {
      const { data: existingAuthUsers } =
        await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = existingAuthUsers?.users.find(
        (u) => u.email === email
      );

      if (existingAuthUser) {
        // Prisma側にユーザーを作成
        const user = await prisma.user.create({
          data: {
            id: existingAuthUser.id,
            email,
            name,
            role,
          },
        });
        console.log(`✓ Created user in DB (Auth existed): ${email}`);
        return user;
      }
    }
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error("Auth user creation returned no user");
  }

  // Prismaにユーザーを作成（Supabase AuthのIDを使用）
  const user = await prisma.user.create({
    data: {
      id: authData.user.id,
      email,
      name,
      role,
    },
  });

  console.log(`✓ Created user: ${email} (${role})`);
  return user;
}

/** カレンダー予定ラベル（設計書 3.3） */
const seedEventLabels = [
  { name: "工事", color: "#F97316", sortOrder: 1 },
  { name: "見積・下見", color: "#3B82F6", sortOrder: 2 },
  { name: "打合せ", color: "#22C55E", sortOrder: 3 },
  { name: "その他", color: "#6B7280", sortOrder: 4 },
];

async function createEventLabels() {
  for (const label of seedEventLabels) {
    const existing = await prisma.eventLabel.findFirst({
      where: { name: label.name },
    });
    if (existing) {
      console.log(`✓ Event label already exists: ${label.name}`);
      continue;
    }
    await prisma.eventLabel.create({ data: label });
    console.log(`✓ Created event label: ${label.name}`);
  }
}

async function main() {
  console.log("🌱 Starting seed...\n");

  // 環境変数チェック
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for seeding.\n" +
        "Get it from Supabase Dashboard > Settings > API > service_role key"
    );
  }

  // ユーザー作成
  for (const userData of seedUsers) {
    try {
      await createUser(userData);
    } catch (error) {
      console.error(`✗ Failed to create user ${userData.email}:`, error);
    }
  }

  // カレンダー予定ラベル作成
  await createEventLabels();

  console.log("\n✅ Seed completed!");
  console.log("\nTest credentials:");
  console.log("  Admin: admin@example.com / password123");
  console.log("  Staff: staff@example.com / password123");
  console.log("\nE2E test credentials:");
  console.log("  Admin: admin-test@example.com / testpass1");
  console.log("  Staff: staff-test@example.com / testpass1");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
