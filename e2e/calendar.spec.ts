import { test, expect } from "@playwright/test";
import { loginAsStaff, screenshotPath } from "./fixtures/test-helpers";

// ============================================================
// カレンダー機能 テスト（予定CRUD）
// ============================================================

test.describe("カレンダー - 予定CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAsStaff(page);
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");
  });

  test("予定を作成 → 表示 → 編集 → 削除の一連フローが動作する", async ({
    page,
  }) => {
    const title = `E2Eテスト予定_${Date.now()}`;
    const editedTitle = `${title}_編集済`;

    // --- 作成 ---
    await page.getByRole("button", { name: "予定を作成" }).click();
    await expect(page.getByRole("heading", { name: "予定作成" })).toBeVisible();

    // タイトル未入力では保存できない
    await expect(page.getByRole("button", { name: "保存" })).toBeDisabled();

    await page.getByPlaceholder("予定タイトル").fill(title);
    await page.getByRole("button", { name: "打合せ" }).click();
    await page.getByPlaceholder("現場住所・集合場所").fill("テスト現場");

    await page.screenshot({
      path: screenshotPath("calendar", "01_予定作成シート"),
    });

    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("予定を作成しました")).toBeVisible();

    // --- カレンダーに表示される（チップはタイトル完全一致で特定） ---
    const chip = page.getByRole("button", { name: title, exact: true });
    await expect(chip).toBeVisible();

    await page.screenshot({
      path: screenshotPath("calendar", "02_予定表示"),
    });

    // --- 詳細を開く ---
    await chip.click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(
      page.getByRole("dialog").getByText("テスト現場")
    ).toBeVisible();

    await page.screenshot({
      path: screenshotPath("calendar", "03_予定詳細"),
    });

    // --- 編集 ---
    await page.getByRole("button", { name: "編集", exact: true }).click();
    await expect(page.getByRole("heading", { name: "予定編集" })).toBeVisible();
    await page.getByPlaceholder("予定タイトル").fill(editedTitle);
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("予定を更新しました")).toBeVisible();

    const editedChip = page.getByRole("button", {
      name: editedTitle,
      exact: true,
    });
    await expect(editedChip).toBeVisible();

    // --- 削除（確認ダイアログ経由） ---
    await editedChip.click();
    await page.getByRole("button", { name: "削除", exact: true }).click();
    await expect(page.getByText("予定を削除しますか？")).toBeVisible();
    await page.getByRole("button", { name: "削除する" }).click();
    await expect(page.getByText("予定を削除しました")).toBeVisible();

    // リストから消えている
    await expect(
      page.getByRole("button", { name: new RegExp(editedTitle) })
    ).toHaveCount(0);
  });

  test("月の前後移動と「今日」復帰が動作する", async ({ page }) => {
    const monthLabel = page.locator("text=/^\\d{4}年\\d{1,2}月$/");
    const current = await monthLabel.textContent();

    await page.getByRole("button", { name: "次の月" }).click();
    await expect(monthLabel).not.toHaveText(current!);

    await page.getByRole("button", { name: "今日" }).click();
    await expect(monthLabel).toHaveText(current!);
  });
});
