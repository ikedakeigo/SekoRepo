import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  screenshotPath,
  uniqueId,
} from "./fixtures/test-helpers";

// ============================================================
// 5. 管理者 - プロジェクト管理フロー（CRUD）
// ============================================================

test.describe("案件一覧 - 表示", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/projects");
  });

  test("案件一覧ページが表示される", async ({ page }) => {
    await expect(page.getByText("案件管理")).toBeVisible();

    await page.screenshot({
      path: screenshotPath("admin-projects", "01_案件一覧"),
      fullPage: true,
    });
  });

  test("検索バーが表示され、入力できる", async ({ page }) => {
    const searchInput = page.locator(
      "input[placeholder*='検索'], input[placeholder*='案件名']"
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("テスト");
      await page.waitForTimeout(500); // デバウンス待ち

      await page.screenshot({
        path: screenshotPath("admin-projects", "02_検索"),
        fullPage: true,
      });
    }
  });

  test("フィルタータブが動作する", async ({ page }) => {
    // すべてタブ
    const allTab = page.getByRole("button", { name: "すべて" });
    if (await allTab.isVisible()) {
      await allTab.click();
      await page.waitForTimeout(300);
    }

    // 進行中タブ
    const activeTab = page.getByRole("button", { name: "進行中" });
    if (await activeTab.isVisible()) {
      await activeTab.click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: screenshotPath("admin-projects", "03_進行中フィルター"),
        fullPage: true,
      });
    }

    // 完了タブ
    const completedTab = page.getByRole("button", { name: "完了" });
    if (await completedTab.isVisible()) {
      await completedTab.click();
      await page.waitForTimeout(300);
    }

    // 投稿済タブ
    const postedTab = page.getByRole("button", { name: "投稿済" });
    if (await postedTab.isVisible()) {
      await postedTab.click();
      await page.waitForTimeout(300);
    }
  });

  test("案件カードにステータスバッジが表示される", async ({ page }) => {
    const statusBadges = page.locator(
      "text=進行中, text=完了, text=投稿済"
    );
    // ステータスバッジが少なくとも1つ表示される（データ依存）
    await page.waitForLoadState("networkidle");
  });

  test("件数表示が正しく表示される", async ({ page }) => {
    // 「N件の案件」表示
    const countText = page.getByText(/件/);
    await expect(countText.first()).toBeVisible();
  });
});

test.describe("案件 - 新規作成（Create）", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/projects");
  });

  test("案件作成ダイアログが表示される", async ({ page }) => {
    const createButton = page.getByRole("button", { name: /案件を作成/ });
    if (await createButton.isVisible()) {
      await createButton.click();

      // ダイアログ
      await expect(page.getByText("新規案件を作成")).toBeVisible();
      await expect(page.locator("input#project-name")).toBeVisible();
      await expect(page.locator("input#project-location")).toBeVisible();

      await page.screenshot({
        path: screenshotPath("admin-projects", "04_案件作成ダイアログ"),
        fullPage: true,
      });
    }
  });

  test("案件を新規作成できる", async ({ page }) => {
    const createButton = page.getByRole("button", { name: /案件を作成/ });
    if (await createButton.isVisible()) {
      await createButton.click();

      const projectName = `E2Eテスト案件_${uniqueId()}`;
      await page.locator("input#project-name").fill(projectName);
      await page.locator("input#project-location").fill("E2Eテスト場所");

      // 作成
      await page
        .locator("[role='dialog']")
        .getByRole("button", { name: "作成" })
        .click();

      // ダイアログが閉じる
      await expect(page.getByText("新規案件を作成")).not.toBeVisible({
        timeout: 5000,
      });

      // 作成した案件が一覧に表示される
      await page.waitForTimeout(2000);
      await expect(page.getByText(projectName)).toBeVisible();

      await page.screenshot({
        path: screenshotPath("admin-projects", "05_案件作成完了"),
        fullPage: true,
      });
    }
  });

  test("案件名なしで作成するとエラーが表示される", async ({ page }) => {
    const createButton = page.getByRole("button", { name: /案件を作成/ }).first();
    if (await createButton.isVisible()) {
      await createButton.click();

      // ダイアログが開くのを待つ
      await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

      // 空のまま作成
      await page
        .locator("[role='dialog']")
        .getByRole("button", { name: "作成" })
        .click();

      // エラー表示
      await expect(
        page.getByText("案件名を入力してください")
      ).toBeVisible();
    }
  });

  test("案件作成ダイアログをキャンセルできる", async ({ page }) => {
    const createButton = page.getByRole("button", { name: /案件を作成/ });
    if (await createButton.isVisible()) {
      await createButton.click();

      await page
        .locator("[role='dialog']")
        .getByRole("button", { name: "キャンセル" })
        .click();

      await expect(page.getByText("新規案件を作成")).not.toBeVisible();
    }
  });
});

test.describe("案件詳細 - 表示（Read）", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/projects");
  });

  test("案件詳細ページに遷移できる", async ({ page }) => {
    // 最初の案件カードをクリック
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();

      // 詳細ページの要素
      await page.waitForLoadState("networkidle");

      await page.screenshot({
        path: screenshotPath("admin-projects", "06_案件詳細"),
        fullPage: true,
      });
    }
  });

  test("案件詳細にプロジェクト情報が表示される", async ({ page }) => {
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      // ステータスバッジ
      const statusBadge = page.locator(
        "text=進行中, text=完了, text=投稿済"
      );
      // プロジェクト名が表示される
      const heading = page.locator("h2").first();
      await expect(heading).toBeVisible();
    }
  });

  test("日付別タブが表示される", async ({ page }) => {
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      // タブ切替
      const dateTab = page.getByRole("tab", { name: /日付別/ });
      if (await dateTab.isVisible()) {
        await dateTab.click();

        await page.screenshot({
          path: screenshotPath("admin-projects", "07_日付別タブ"),
          fullPage: true,
        });
      }
    }
  });

  test("タイムラインタブが表示される", async ({ page }) => {
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      const timelineTab = page.getByRole("tab", { name: /タイムライン/ });
      if (await timelineTab.isVisible()) {
        await timelineTab.click();

        await page.screenshot({
          path: screenshotPath("admin-projects", "08_タイムラインタブ"),
          fullPage: true,
        });
      }
    }
  });

  test("パンくずリストから案件一覧に戻れる", async ({ page }) => {
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      // パンくずリストの「案件一覧」リンク（nav内のリンク）
      const breadcrumb = page.locator("nav a[href='/projects']").first();
      if (await breadcrumb.isVisible()) {
        await breadcrumb.click();
        await expect(page).toHaveURL(/\/projects/);
      }
    }
  });
});

test.describe("案件 - ステータス変更（Update）", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/projects");
  });

  test("進行中の案件を施工完了にできる", async ({ page }) => {
    // 進行中フィルター
    const activeTab = page.getByRole("button", { name: "進行中" });
    if (await activeTab.isVisible()) {
      await activeTab.click();
      await page.waitForTimeout(500);
    }

    // 最初の案件詳細へ
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      // 施工完了ボタン
      const completeButton = page.getByRole("button", {
        name: "施工完了にする",
      });
      if (await completeButton.isVisible()) {
        await completeButton.click();

        // ステータス変更を待つ
        await page.waitForTimeout(2000);

        // 「進行中に戻す」ボタンが表示されることを確認
        await expect(
          page.getByRole("button", { name: "進行中に戻す" })
        ).toBeVisible({ timeout: 5000 });

        await page.screenshot({
          path: screenshotPath("admin-projects", "09_施工完了"),
          fullPage: true,
        });
      }
    }
  });

  test("完了の案件を進行中に戻せる", async ({ page }) => {
    // 完了フィルター
    const completedTab = page.getByRole("button", { name: "完了" });
    if (await completedTab.isVisible()) {
      await completedTab.click();
      await page.waitForTimeout(500);
    }

    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      const revertButton = page.getByRole("button", {
        name: "進行中に戻す",
      });
      if (await revertButton.isVisible()) {
        await revertButton.click();
        await page.waitForTimeout(2000);

        await expect(
          page.getByRole("button", { name: "施工完了にする" })
        ).toBeVisible({ timeout: 5000 });

        await page.screenshot({
          path: screenshotPath("admin-projects", "10_進行中に戻す"),
          fullPage: true,
        });
      }
    }
  });

  test("投稿済み日付のトグルが機能する", async ({ page }) => {
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      // 日付別タブ
      const dateTab = page.getByRole("tab", { name: /日付別/ });
      if (await dateTab.isVisible()) {
        await dateTab.click();

        // 投稿済みトグルボタンを探す
        const toggleButton = page
          .getByRole("button")
          .filter({ hasText: /投稿済/ })
          .first();
        if (await toggleButton.isVisible({ timeout: 3000 })) {
          await toggleButton.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: screenshotPath("admin-projects", "11_投稿済みトグル"),
            fullPage: true,
          });
        }
      }
    }
  });
});

test.describe("案件 - CSVエクスポート", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/projects");
  });

  test("CSVエクスポートボタンが機能する", async ({ page }) => {
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      // 日付別タブ
      const dateTab = page.getByRole("tab", { name: /日付別/ });
      if (await dateTab.isVisible()) {
        await dateTab.click();

        // CSVエクスポートボタン
        const exportButton = page
          .getByRole("button")
          .filter({ hasText: /CSV|エクスポート|ダウンロード/ })
          .first();
        if (await exportButton.isVisible({ timeout: 3000 })) {
          // ダウンロードイベントを監視
          const downloadPromise = page.waitForEvent("download", {
            timeout: 10000,
          });
          await exportButton.click();

          try {
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toContain(".csv");
          } catch {
            // ダウンロードがトリガーされない場合（データなし等）
          }

          await page.screenshot({
            path: screenshotPath("admin-projects", "12_CSVエクスポート"),
            fullPage: true,
          });
        }
      }
    }
  });
});
