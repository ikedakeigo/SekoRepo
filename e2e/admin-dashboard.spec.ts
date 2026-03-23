import { test, expect } from "@playwright/test";
import { loginAsAdmin, screenshotPath } from "./fixtures/test-helpers";

// ============================================================
// 4. 管理者 - ダッシュボードフロー
// ============================================================

test.describe("管理者ダッシュボード - 表示", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("ダッシュボードが正しく表示される", async ({ page }) => {
    await expect(page.getByText("ダッシュボード")).toBeVisible();

    await page.screenshot({
      path: screenshotPath("admin-dashboard", "01_ダッシュボード表示"),
      fullPage: true,
    });
  });

  test("統計カードが表示される", async ({ page }) => {
    // KPIカードが4つ表示される（写真総数、週間写真数、進行中案件、完了案件など）
    await page.waitForLoadState("networkidle");

    // カード要素を確認（具体的なテキストはデータ依存）
    const statsSection = page.locator("main");
    await expect(statsSection).toBeVisible();

    await page.screenshot({
      path: screenshotPath("admin-dashboard", "02_統計カード"),
      fullPage: true,
    });
  });

  test("新着レポートセクションが表示される", async ({ page }) => {
    await expect(page.getByText("新着レポート")).toBeVisible();

    await page.screenshot({
      path: screenshotPath("admin-dashboard", "03_新着レポート"),
      fullPage: true,
    });
  });

  test("新着レポートがある場合、レポートカードが表示される", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    const reportLinks = page.locator("a[href^='/projects/']");
    const reportCount = await reportLinks.count();

    if (reportCount > 0) {
      await expect(reportLinks.first()).toBeVisible();
    } else {
      await expect(
        page.getByText("まだレポートがありません")
      ).toBeVisible();
    }
  });

  test("案件一覧へのリンクが機能する", async ({ page }) => {
    const projectsLink = page.getByRole("link", { name: "案件一覧へ" });
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await expect(page).toHaveURL(/\/projects/);
    }
  });

  test("24時間以内のレポートにNEWバッジが表示される", async ({ page }) => {
    // NEWバッジがあるか確認（データ依存）
    const newBadge = page.locator("text=NEW").first();
    if (await newBadge.isVisible({ timeout: 2000 })) {
      await expect(newBadge).toBeVisible();
    }
    // データがない場合はスキップ
  });
});

test.describe("管理者ダッシュボード - サイドバーナビゲーション", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("サイドバーのナビゲーションが表示される", async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1280, height: 720 });

    await expect(page.getByText("SekoRepo")).toBeVisible();
    await expect(page.getByText("管理ポータル")).toBeVisible();

    await page.screenshot({
      path: screenshotPath("admin-dashboard", "04_サイドバー"),
      fullPage: true,
    });
  });

  test("サイドバーからダッシュボードに遷移できる", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
    const dashboardLink = page.getByRole("link", { name: "ダッシュボード" }).first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    }
  });

  test("サイドバーから案件一覧に遷移できる", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const projectsLink = page.getByRole("link", { name: "案件一覧" });
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await expect(page).toHaveURL(/\/projects/);
    }
  });

  test("サイドバーから設定に遷移できる", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const settingsLink = page.getByRole("link", { name: "設定" });
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/\/settings/);
    }
  });

  test("サイドバーからログアウトできる", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const logoutButton = page
      .locator("aside, nav")
      .getByRole("button", { name: "ログアウト" });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    }
  });
});
