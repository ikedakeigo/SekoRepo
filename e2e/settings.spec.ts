import { test, expect } from "@playwright/test";
import {
  loginAsStaff,
  loginAsAdmin,
  screenshotPath,
} from "./fixtures/test-helpers";

// ============================================================
// 7. 設定ページ テスト
// ============================================================

test.describe("設定ページ - staff", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
  });

  test("設定ページが表示される", async ({ page }) => {
    // h1の「設定」タイトル
    await expect(page.locator("h1")).toContainText("設定");

    await page.screenshot({
      path: screenshotPath("settings", "01_設定ページstaff"),
      fullPage: true,
    });
  });

  test("プロフィール情報が表示される", async ({ page }) => {
    // プロフィールカード
    await expect(page.getByText("プロフィール")).toBeVisible();
    // ロールバッジ
    await expect(page.getByText("スタッフ")).toBeVisible();
  });

  test("外観設定が表示される", async ({ page }) => {
    await expect(page.getByText("外観")).toBeVisible();
  });

  test("アプリ情報が表示される", async ({ page }) => {
    await expect(page.getByText("アプリ情報")).toBeVisible();
    // アプリ名のラベルと値
    await expect(page.getByText("アプリ名")).toBeVisible();
  });

  test("ログアウトボタンが表示される", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "ログアウト" })
    ).toBeVisible();
  });
});

test.describe("設定ページ - admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("管理者の設定ページが表示される", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText("設定");
    // 管理者ロールバッジ
    await expect(page.getByText("管理者").first()).toBeVisible();

    await page.screenshot({
      path: screenshotPath("settings", "02_設定ページadmin"),
      fullPage: true,
    });
  });
});
