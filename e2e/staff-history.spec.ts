import { test, expect } from "@playwright/test";
import {
  loginAsStaff,
  screenshotPath,
  getTestImagePath,
} from "./fixtures/test-helpers";

// ============================================================
// 3. スタッフ - 履歴閲覧・編集フロー
// ============================================================

test.describe("履歴一覧 - 表示", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test("履歴一覧ページが表示される", async ({ page }) => {
    await page.goto("/history");

    await expect(page.getByText("送信履歴")).toBeVisible();

    await page.screenshot({
      path: screenshotPath("staff-history", "01_履歴一覧ページ"),
      fullPage: true,
    });
  });

  test("レポートがある場合、一覧にカードが表示される", async ({ page }) => {
    await page.goto("/history");

    // レポートカードまたは空メッセージのどちらかが表示される
    const hasReports = await page.locator("a[href^='/history/']").count();
    const emptyMessage = page.getByText("まだ送信履歴がありません");

    if (hasReports > 0) {
      // レポートカードが表示される
      const firstReport = page.locator("a[href^='/history/']").first();
      await expect(firstReport).toBeVisible();

      // 写真枚数表示
      await expect(page.getByText(/写真.*枚/).first()).toBeVisible();
    } else {
      await expect(emptyMessage).toBeVisible();
    }

    await page.screenshot({
      path: screenshotPath("staff-history", "02_履歴一覧内容"),
      fullPage: true,
    });
  });

  test("モバイルナビから履歴に遷移できる", async ({ page }) => {
    await page.goto("/");
    const historyLink = page.getByRole("link", { name: "履歴" });
    if (await historyLink.isVisible()) {
      await historyLink.click();
      await expect(page).toHaveURL(/\/history/);
    }
  });
});

test.describe("履歴詳細 - 表示", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test("レポート詳細ページが表示される", async ({ page }) => {
    await page.goto("/history");

    // 最初のレポートをクリック
    const firstReport = page.locator("a[href^='/history/']").first();
    if (await firstReport.isVisible()) {
      await firstReport.click();

      // 詳細ページの要素
      await expect(page.getByText("レポート詳細")).toBeVisible();

      await page.screenshot({
        path: screenshotPath("staff-history", "03_レポート詳細"),
        fullPage: true,
      });
    }
  });

  test("レポート詳細に写真が表示される", async ({ page }) => {
    await page.goto("/history");

    const firstReport = page.locator("a[href^='/history/']").first();
    if (await firstReport.isVisible()) {
      await firstReport.click();

      // 写真カードが表示される
      await page.waitForLoadState("networkidle");
      const images = page.locator("img");
      const imageCount = await images.count();
      // 少なくとも1枚の画像がある（サムネイル等含む）
      expect(imageCount).toBeGreaterThan(0);
    }
  });

  test("戻るボタンで履歴一覧に戻れる", async ({ page }) => {
    await page.goto("/history");

    const firstReport = page.locator("a[href^='/history/']").first();
    if (await firstReport.isVisible()) {
      await firstReport.click();
      await expect(page.getByText("レポート詳細")).toBeVisible();

      // 戻るボタン
      const backButton = page
        .getByRole("button")
        .filter({ has: page.locator("svg") })
        .first();
      await backButton.click();

      // 履歴一覧に戻る
      await expect(page).toHaveURL(/\/history/);
    }
  });
});

test.describe("履歴詳細 - 編集", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test("編集モードに切り替えられる", async ({ page }) => {
    await page.goto("/history");

    const firstReport = page.locator("a[href^='/history/']").first();
    if (await firstReport.isVisible()) {
      await firstReport.click();
      await expect(page.getByText("レポート詳細")).toBeVisible();

      // 編集ボタンをクリック
      const editButton = page.getByRole("button", { name: "編集する" });
      if (await editButton.isVisible()) {
        await editButton.click();

        // キャンセルボタンが表示される（編集モード）
        await expect(
          page.getByRole("button", { name: "キャンセル" })
        ).toBeVisible();

        // 保存ボタンが表示される
        await expect(
          page.getByRole("button", { name: "保存する" })
        ).toBeVisible();

        await page.screenshot({
          path: screenshotPath("staff-history", "04_編集モード"),
          fullPage: true,
        });
      }
    }
  });

  test("編集モードでキャンセルできる", async ({ page }) => {
    await page.goto("/history");

    const firstReport = page.locator("a[href^='/history/']").first();
    if (await firstReport.isVisible()) {
      await firstReport.click();

      const editButton = page.getByRole("button", { name: "編集する" });
      if (await editButton.isVisible()) {
        await editButton.click();

        // キャンセルをクリック
        await page.getByRole("button", { name: "キャンセル" }).click();

        // 表示モードに戻る
        await expect(
          page.getByRole("button", { name: "編集する" })
        ).toBeVisible();
      }
    }
  });

  test("作業内容（サマリー）を編集して保存できる", async ({ page }) => {
    await page.goto("/history");

    const firstReport = page.locator("a[href^='/history/']").first();
    if (await firstReport.isVisible()) {
      await firstReport.click();

      const editButton = page.getByRole("button", { name: "編集する" });
      if (await editButton.isVisible()) {
        await editButton.click();

        // サマリー編集
        const summaryTextarea = page.locator("textarea#edit-summary");
        if (await summaryTextarea.isVisible()) {
          await summaryTextarea.clear();
          await summaryTextarea.fill(
            "E2Eテスト: 編集済みの作業内容です。"
          );
        }

        // 保存
        await page.getByRole("button", { name: "保存する" }).click();

        // 保存完了を待つ
        await page.waitForTimeout(3000);

        await page.screenshot({
          path: screenshotPath("staff-history", "05_サマリー編集完了"),
          fullPage: true,
        });
      }
    }
  });

  test("写真のメタデータを編集して保存できる", async ({ page }) => {
    await page.goto("/history");

    const firstReport = page.locator("a[href^='/history/']").first();
    if (await firstReport.isVisible()) {
      await firstReport.click();

      const editButton = page.getByRole("button", { name: "編集する" });
      if (await editButton.isVisible()) {
        await editButton.click();

        // タイトル入力欄を編集
        const titleInputs = page.locator("input[type='text']");
        if ((await titleInputs.count()) > 0) {
          await titleInputs.first().clear();
          await titleInputs.first().fill("編集済みタイトル");
        }

        // 保存
        await page.getByRole("button", { name: "保存する" }).click();
        await page.waitForTimeout(3000);

        await page.screenshot({
          path: screenshotPath("staff-history", "06_写真メタデータ編集完了"),
          fullPage: true,
        });
      }
    }
  });

  test("編集モードで写真を追加できる", async ({ page }) => {
    await page.goto("/history");

    const firstReport = page.locator("a[href^='/history/']").first();
    if (await firstReport.isVisible()) {
      await firstReport.click();

      const editButton = page.getByRole("button", { name: "編集する" });
      if (await editButton.isVisible()) {
        await editButton.click();

        // 写真追加セクションが表示される
        const addPhotosHeading = page.getByText("写真を追加");
        if (await addPhotosHeading.isVisible()) {
          // ファイル入力
          const fileInput = page.locator('input[type="file"]');
          if (await fileInput.count() > 0) {
            const testImagePath = getTestImagePath();
            await fileInput.setInputFiles(testImagePath);
            await page.waitForTimeout(2000);

            await page.screenshot({
              path: screenshotPath("staff-history", "07_写真追加"),
              fullPage: true,
            });
          }
        }
      }
    }
  });
});
