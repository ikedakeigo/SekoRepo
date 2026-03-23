import { test, expect } from "@playwright/test";
import {
  STAFF_USER,
  ADMIN_USER,
  loginAsStaff,
  loginAsAdmin,
  screenshotPath,
} from "./fixtures/test-helpers";

// ============================================================
// 1. 認証フロー テスト
// ============================================================

test.describe("認証 - ログインページ表示", () => {
  test("ログインページが正しく表示される", async ({ page }) => {
    await page.goto("/login");

    // メールアドレス入力欄
    await expect(page.locator("input#email")).toBeVisible();
    // パスワード入力欄
    await expect(page.locator("input#password")).toBeVisible();
    // ログインボタン
    await expect(
      page.getByRole("button", { name: "ログイン" })
    ).toBeVisible();
    // 新規登録リンク
    await expect(page.getByRole("link", { name: "新規登録" })).toBeVisible();

    await page.screenshot({
      path: screenshotPath("auth", "01_ログインページ表示"),
      fullPage: true,
    });
  });

  test("パスワード表示/非表示トグルが動作する", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.locator("input#password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // 目のアイコンをクリック
    await page
      .locator("input#password")
      .locator("..")
      .getByRole("button")
      .click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    // もう一度クリックで非表示に戻る
    await page
      .locator("input#password")
      .locator("..")
      .getByRole("button")
      .click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});

test.describe("認証 - ログインバリデーション", () => {
  test("空のフォームで送信するとエラーが表示される", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "ログイン" }).click();

    // バリデーションエラーメッセージ
    await expect(
      page.getByText("メールアドレスを入力してください")
    ).toBeVisible();
    await expect(
      page.getByText("パスワードを入力してください")
    ).toBeVisible();

    await page.screenshot({
      path: screenshotPath("auth", "02_ログインバリデーションエラー"),
      fullPage: true,
    });
  });

  test("無効なメールアドレスでエラーが表示される", async ({ page }) => {
    await page.goto("/login");
    // type=emailのブラウザバリデーションを回避するためJSで値をセット
    await page.locator("input#email").evaluate(
      (el: HTMLInputElement) => { el.type = "text"; }
    );
    await page.locator("input#email").fill("invalid-email");
    await page.locator("input#password").fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(
      page.getByText("有効なメールアドレスを入力してください")
    ).toBeVisible();
  });

  test("間違った認証情報でエラーが表示される", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input#email").fill("wrong@example.com");
    await page.locator("input#password").fill("wrongpassword1");
    await page.getByRole("button", { name: "ログイン" }).click();

    // サーバーエラーメッセージ表示を待つ
    await expect(page.locator(".bg-red-50, .text-red-500").first()).toBeVisible(
      { timeout: 10000 }
    );

    await page.screenshot({
      path: screenshotPath("auth", "03_ログイン認証失敗"),
      fullPage: true,
    });
  });
});

test.describe("認証 - staffログイン", () => {
  test("staffユーザーがログインしてホームにリダイレクトされる", async ({
    page,
  }) => {
    await loginAsStaff(page);

    await expect(page).toHaveURL("/");
    // ホームページの要素が表示される
    await expect(page.locator("body")).toBeVisible();

    await page.screenshot({
      path: screenshotPath("auth", "04_staffログイン成功"),
      fullPage: true,
    });
  });
});

test.describe("認証 - adminログイン", () => {
  test("adminユーザーがログインしてダッシュボードにリダイレクトされる", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await expect(page).toHaveURL(/\/dashboard/);
    // ダッシュボードの要素が表示される
    await expect(page.getByText("ダッシュボード")).toBeVisible();

    await page.screenshot({
      path: screenshotPath("auth", "05_adminログイン成功"),
      fullPage: true,
    });
  });
});

test.describe("認証 - 未認証アクセス制御", () => {
  test("未認証ユーザーはホームからログインにリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未認証ユーザーはレポート作成からログインにリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/report/new");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未認証ユーザーは履歴からログインにリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/history");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未認証ユーザーはダッシュボードからログインにリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未認証ユーザーは案件一覧からログインにリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("認証 - ロールベースアクセス制御", () => {
  test("staffユーザーがadminページにアクセスするとホームにリダイレクトされる", async ({
    page,
  }) => {
    await loginAsStaff(page);

    await page.goto("/dashboard");
    // staffはadminページにアクセス不可 → リダイレクト
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test("adminユーザーがstaffホームにアクセスするとダッシュボードにリダイレクトされる", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/");
    // adminはstaffホームにアクセス → ダッシュボードへリダイレクト
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("認証 - ログアウト", () => {
  test("staffユーザーがログアウトできる", async ({ page }) => {
    await loginAsStaff(page);

    // 設定ページからログアウト
    await page.goto("/settings");
    await page.getByRole("button", { name: "ログアウト" }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    await page.screenshot({
      path: screenshotPath("auth", "06_ログアウト後"),
      fullPage: true,
    });
  });

  test("adminユーザーがログアウトできる", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    // 設定ページ内のログアウトボタンをクリック
    const logoutButton = page.getByRole("button", { name: "ログアウト" }).first();
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

test.describe("認証 - サインアップページ表示", () => {
  test("サインアップページが正しく表示される", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.locator("input#name")).toBeVisible();
    await expect(page.locator("input#email")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.locator("input#confirmPassword")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "新規登録" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "ログイン" })).toBeVisible();

    await page.screenshot({
      path: screenshotPath("auth", "07_サインアップページ表示"),
      fullPage: true,
    });
  });

  test("サインアップバリデーション - 空送信", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "新規登録" }).click();

    await expect(
      page.getByText("お名前を入力してください")
    ).toBeVisible();
    await expect(
      page.getByText("メールアドレスを入力してください")
    ).toBeVisible();

    await page.screenshot({
      path: screenshotPath("auth", "08_サインアップバリデーション"),
      fullPage: true,
    });
  });

  test("サインアップバリデーション - パスワード不一致", async ({ page }) => {
    await page.goto("/signup");
    await page.locator("input#name").fill("テスト");
    await page.locator("input#email").fill("test@example.com");
    await page.locator("input#password").fill("testpass1");
    await page.locator("input#confirmPassword").fill("different1");
    await page.getByRole("button", { name: "新規登録" }).click();

    await expect(page.getByText("パスワードが一致しません")).toBeVisible();
  });

  test("サインアップバリデーション - パスワード要件不足", async ({
    page,
  }) => {
    await page.goto("/signup");
    await page.locator("input#name").fill("テスト");
    await page.locator("input#email").fill("test@example.com");
    await page.locator("input#password").fill("short");
    await page.locator("input#confirmPassword").fill("short");
    await page.getByRole("button", { name: "新規登録" }).click();

    await expect(
      page.getByText("パスワードは8文字以上で、小文字・数字を含めてください")
    ).toBeVisible();
  });
});
