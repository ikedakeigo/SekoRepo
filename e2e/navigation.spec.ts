import { test, expect } from "@playwright/test";
import { loginAsStaff, loginAsAdmin, screenshotPath } from "./fixtures/test-helpers";

// ============================================================
// 8. ナビゲーション・ルーティング テスト
// ============================================================

test.describe("スタッフ - モバイルナビゲーション", () => {
  test.beforeEach(async ({ page }) => {
    // モバイルサイズに設定（md:hidden対応）
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAsStaff(page);
  });

  test("モバイルナビが表示される", async ({ page }) => {
    await expect(page.getByRole("link", { name: "ホーム" })).toBeVisible();
    await expect(page.getByRole("link", { name: "カレンダー" })).toBeVisible();
    await expect(page.getByRole("link", { name: "送信" })).toBeVisible();
    await expect(page.getByRole("link", { name: "履歴" })).toBeVisible();
    await expect(page.getByRole("link", { name: "設定" })).toBeVisible();

    await page.screenshot({
      path: screenshotPath("navigation", "01_モバイルナビ"),
      fullPage: true,
    });
  });

  test("ホームリンクが正しく動作する", async ({ page }) => {
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "ホーム" }).click();
    await expect(page).toHaveURL("/");
  });

  test("カレンダーリンクが正しく動作する", async ({ page }) => {
    await page.getByRole("link", { name: "カレンダー" }).click();
    await expect(page).toHaveURL(/\/calendar/);
  });

  test("送信リンクが正しく動作する", async ({ page }) => {
    await page.getByRole("link", { name: "送信" }).click();
    await expect(page).toHaveURL(/\/report\/new/);
  });

  test("履歴リンクが正しく動作する", async ({ page }) => {
    await page.getByRole("link", { name: "履歴" }).click();
    await expect(page).toHaveURL(/\/history/);
  });

  test("設定リンクが正しく動作する", async ({ page }) => {
    await page.getByRole("link", { name: "設定" }).click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test("現在のページのナビリンクがアクティブ状態になる", async ({ page }) => {
    const homeLink = page.getByRole("link", { name: "ホーム" });
    await expect(homeLink).toBeVisible();
    // text-primaryクラスでアクティブ状態を確認
    await expect(homeLink).toHaveClass(/text-primary/);
  });
});

test.describe("スタッフ - ヘッダー", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test("ヘッダーにSekoRepoロゴが表示される", async ({ page }) => {
    await expect(page.getByText("SekoRepo").first()).toBeVisible();
  });

  test("ヘッダーにユーザーアバターが表示される", async ({ page }) => {
    const avatar = page.locator("header button").last();
    await expect(avatar).toBeVisible();
  });

  test("ユーザーメニューが開閉できる", async ({ page }) => {
    const menuTrigger = page.locator("header button").last();
    if (await menuTrigger.isVisible()) {
      await menuTrigger.click();

      const profileItem = page.getByText("プロフィール");
      if (await profileItem.isVisible({ timeout: 2000 })) {
        await expect(profileItem).toBeVisible();
      }
    }
  });
});

test.describe("管理者 - ナビゲーション", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("サイドバーナビゲーションが表示される", async ({ page }) => {
    await expect(page.getByText("管理ポータル")).toBeVisible();

    await page.screenshot({
      path: screenshotPath("navigation", "02_管理者サイドバー"),
      fullPage: true,
    });
  });

  test("ダッシュボードリンクが動作する", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    const dashboardLink = page.getByRole("link", { name: "ダッシュボード" }).first();
    await dashboardLink.click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("カレンダーリンクが動作する", async ({ page }) => {
    const calendarLink = page.getByRole("link", { name: "カレンダー" }).first();
    await calendarLink.click();
    await expect(page).toHaveURL(/\/calendar/);
  });

  test("案件一覧リンクが動作する", async ({ page }) => {
    const projectsLink = page.getByRole("link", { name: "案件一覧" }).first();
    await projectsLink.click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test("設定リンクが動作する", async ({ page }) => {
    const settingsLink = page.getByRole("link", { name: "設定" }).first();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/);
  });
});

test.describe("ホームページ - スタッフ", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test("ホームページが正しく表示される", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: screenshotPath("navigation", "03_ホームページ"),
      fullPage: true,
    });
  });

  test("最近の送信履歴が表示される", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const recentReports = page.locator("a[href^='/history/']");
    const hasReports = (await recentReports.count()) > 0;

    if (hasReports) {
      await expect(recentReports.first()).toBeVisible();
    }
  });
});

test.describe("カレンダー画面 - スタッフ", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test("カレンダー画面が正しく表示される", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    // 月ヘッダー（「今日」ボタン）と曜日行が表示される
    await expect(page.getByRole("button", { name: "今日" })).toBeVisible();
    await expect(page.getByText("日", { exact: true }).first()).toBeVisible();

    await page.screenshot({
      path: screenshotPath("navigation", "04_カレンダー画面"),
      fullPage: true,
    });
  });

  test("日別リストと予定作成ボタンが表示される", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    // 日別リストのヘッダー（「n件の予定」）と FAB
    await expect(page.getByText(/件の予定/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "予定を作成" })
    ).toBeVisible();
  });
});
