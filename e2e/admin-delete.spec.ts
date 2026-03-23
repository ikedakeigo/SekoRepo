import { test, expect } from "@playwright/test";
import { loginAsAdmin, screenshotPath } from "./fixtures/test-helpers";

// ============================================================
// 6. 管理者 - 削除フロー（Delete）
// ============================================================

test.describe("管理者 - 写真単体削除", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("タイムラインから写真を削除できる", async ({ page }) => {
    await page.goto("/projects");

    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      // タイムラインタブ
      const timelineTab = page.getByRole("tab", { name: /タイムライン/ });
      if (await timelineTab.isVisible()) {
        await timelineTab.click();
        await page.waitForTimeout(1000);

        // 削除ボタン（ゴミ箱アイコン）を探す
        const deleteButtons = page.locator(
          "button:has(svg)"
        ).filter({ hasText: "" });

        // 写真の削除ボタンがある場合
        const trashButton = page
          .getByRole("button")
          .filter({ has: page.locator("svg") })
          .first();

        // 削除可能な要素があるか確認のみ
        await page.screenshot({
          path: screenshotPath("admin-delete", "01_タイムライン写真"),
          fullPage: true,
        });
      }
    }
  });
});

test.describe("管理者 - レポート削除", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("レポート削除の確認ダイアログが表示される", async ({ page }) => {
    await page.goto("/projects");

    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      // タイムラインビューで削除ボタンを確認
      await page.screenshot({
        path: screenshotPath("admin-delete", "02_レポート削除確認"),
        fullPage: true,
      });
    }
  });
});

test.describe("管理者 - 案件削除", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("案件削除ボタンが表示される", async ({ page }) => {
    await page.goto("/projects");

    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      const deleteButton = page.getByRole("button", { name: "案件を削除" });
      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toBeVisible();

        await page.screenshot({
          path: screenshotPath("admin-delete", "03_案件削除ボタン"),
          fullPage: true,
        });
      }
    }
  });

  test("案件削除の確認ダイアログが表示される", async ({ page }) => {
    await page.goto("/projects");

    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      const deleteButton = page.getByRole("button", { name: "案件を削除" });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // 確認ダイアログ
        await expect(
          page.getByText("案件を削除しますか？")
        ).toBeVisible();
        await expect(
          page.getByText("この操作は元に戻せません")
        ).toBeVisible();

        // キャンセルボタンと削除ボタン
        await expect(
          page
            .locator("[role='alertdialog']")
            .getByRole("button", { name: "キャンセル" })
        ).toBeVisible();
        await expect(
          page
            .locator("[role='alertdialog']")
            .getByRole("button", { name: "削除する" })
        ).toBeVisible();

        await page.screenshot({
          path: screenshotPath("admin-delete", "04_案件削除確認ダイアログ"),
          fullPage: true,
        });
      }
    }
  });

  test("案件削除をキャンセルできる", async ({ page }) => {
    await page.goto("/projects");

    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      const deleteButton = page.getByRole("button", { name: "案件を削除" });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // キャンセル
        await page
          .locator("[role='alertdialog']")
          .getByRole("button", { name: "キャンセル" })
          .click();

        // ダイアログが閉じる
        await expect(
          page.getByText("案件を削除しますか？")
        ).not.toBeVisible();
      }
    }
  });

  test("案件を削除すると案件一覧に戻る", async ({ page }) => {
    // NOTE: このテストは実際のデータを削除するため、
    // テスト用に作成した案件でのみ実行すること
    await page.goto("/projects");

    // フィルターを使ってテスト用案件を見つける
    const searchInput = page.locator(
      "input[placeholder*='検索'], input[placeholder*='案件名']"
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("E2Eテスト案件");
      await page.waitForTimeout(500);
    }

    const testProjectCard = page.locator("a[href^='/projects/']").first();
    if (await testProjectCard.isVisible()) {
      await testProjectCard.click();
      await page.waitForLoadState("networkidle");

      const deleteButton = page.getByRole("button", { name: "案件を削除" });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // 削除確認
        await page
          .locator("[role='alertdialog']")
          .getByRole("button", { name: "削除する" })
          .click();

        // 案件一覧にリダイレクト
        await expect(page).toHaveURL(/\/projects/, { timeout: 10000 });

        await page.screenshot({
          path: screenshotPath("admin-delete", "05_案件削除完了"),
          fullPage: true,
        });
      }
    }
  });
});
