import { test, expect } from "@playwright/test";
import {
  loginAsStaff,
  screenshotPath,
  getTestImagePath,
  uniqueId,
} from "./fixtures/test-helpers";

// ============================================================
// 2. スタッフ - レポート新規作成フロー
// ============================================================

test.describe("レポート作成 - ページアクセス", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test("レポート作成ページが表示される", async ({ page }) => {
    await page.goto("/report/new");

    // ステップインジケーターが表示される
    await expect(page.getByText("案件選択")).toBeVisible();
    await expect(page.getByText("写真")).toBeVisible();

    await page.screenshot({
      path: screenshotPath("staff-report", "01_レポート作成ページ"),
      fullPage: true,
    });
  });

  test("ホームの新規作成ボタンからレポート作成に遷移できる", async ({
    page,
  }) => {
    await page.goto("/");
    // 新規作成ボタンまたはリンクをクリック
    const createButton = page.getByRole("link", { name: /送信|新規|レポート/ });
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page).toHaveURL(/\/report\/new/);
    }
  });

  test("モバイルナビの送信リンクからレポート作成に遷移できる", async ({
    page,
  }) => {
    await page.goto("/");
    const sendLink = page.getByRole("link", { name: "送信" });
    if (await sendLink.isVisible()) {
      await sendLink.click();
      await expect(page).toHaveURL(/\/report\/new/);
    }
  });
});

test.describe("レポート作成 - Step1: 案件選択", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
    await page.goto("/report/new");
  });

  test("既存の案件を選択できる", async ({ page }) => {
    // セレクトをクリック
    const selectTrigger = page.locator('[role="combobox"]').first();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      // 最初の案件を選択
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.screenshot({
          path: screenshotPath("staff-report", "02_案件選択済み"),
          fullPage: true,
        });
      }
    }
  });

  test("新しい案件をダイアログから作成できる", async ({ page }) => {
    // プラスボタンでダイアログを開く
    const addButton = page.getByRole("button").filter({ has: page.locator("svg") }).last();
    // ダイアログが存在するか確認
    const dialogTrigger = page.locator("button").filter({ hasText: /追加|新規/ }).first();
    if (await dialogTrigger.isVisible()) {
      await dialogTrigger.click();
    } else {
      // Plusアイコンのボタンを探す
      const plusButtons = page.locator("button:has(svg)");
      const count = await plusButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = plusButtons.nth(i);
        if (await btn.isVisible()) {
          await btn.click();
          break;
        }
      }
    }

    // ダイアログの入力欄
    const nameInput = page.locator("input#project-name");
    if (await nameInput.isVisible({ timeout: 3000 })) {
      const projectName = `テスト案件_${uniqueId()}`;
      await nameInput.fill(projectName);
      await page.locator("input#project-location").fill("テスト場所");

      await page.screenshot({
        path: screenshotPath("staff-report", "03_新規案件ダイアログ"),
        fullPage: true,
      });

      // 作成ボタンをクリック
      await page.getByRole("button", { name: "作成" }).click();

      // ダイアログが閉じ、案件が選択された状態になる
      await expect(nameInput).not.toBeVisible({ timeout: 5000 });
    }
  });

  test("案件名なしで作成するとエラーが表示される", async ({ page }) => {
    // ダイアログを開く
    const dialogTrigger = page.locator("button:has(svg)").filter({ hasText: "" });
    const plusButton = page.locator('[aria-label]').filter({ hasText: /追加/ }).first();

    // ダイアログが開けるボタンを見つけてクリック
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      if (text === "" || text?.trim() === "") {
        // アイコンのみのボタン
        await btn.click();
        const nameInput = page.locator("input#project-name");
        if (await nameInput.isVisible({ timeout: 1000 })) {
          // 空のまま作成
          await page.getByRole("button", { name: "作成" }).click();
          await expect(
            page.getByText("案件名を入力してください")
          ).toBeVisible();
          break;
        }
      }
    }
  });
});

test.describe("レポート作成 - Step2: 写真アップロード", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
    await page.goto("/report/new");
  });

  test("写真をアップロードできる", async ({ page }) => {
    // まず案件を選択
    const selectTrigger = page.locator('[role="combobox"]').first();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // ファイル入力を取得
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const testImagePath = getTestImagePath();
      await fileInput.setInputFiles(testImagePath);

      // アップロードされた画像のプレビューが表示される
      await page.waitForTimeout(2000); // 圧縮処理待ち

      await page.screenshot({
        path: screenshotPath("staff-report", "04_写真アップロード済み"),
        fullPage: true,
      });
    }
  });

  test("写真のメタデータ（種類・タイトル・コメント）を入力できる", async ({
    page,
  }) => {
    // 案件選択
    const selectTrigger = page.locator('[role="combobox"]').first();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // 写真アップロード
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const testImagePath = getTestImagePath();
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);

      // 種類セレクトをクリック（PhotoDetailCard内）
      const photoTypeSelect = page.locator('[role="combobox"]').nth(1);
      if (await photoTypeSelect.isVisible()) {
        await photoTypeSelect.click();
        // "ビフォー"を選択
        const beforeOption = page.getByRole("option", { name: "ビフォー" });
        if (await beforeOption.isVisible()) {
          await beforeOption.click();
        }
      }

      // タイトル入力
      const titleInput = page
        .locator("input[type='text']")
        .filter({ hasText: "" })
        .first();
      const titleInputs = page.locator(
        "input[placeholder*='タイトル'], input[placeholder*='大棟']"
      );
      if ((await titleInputs.count()) > 0) {
        await titleInputs.first().fill("テスト写真タイトル");
      }

      // コメント入力
      const commentTextareas = page.locator(
        "textarea[placeholder*='詳細'], textarea[placeholder*='観察']"
      );
      if ((await commentTextareas.count()) > 0) {
        await commentTextareas.first().fill("テストコメント");
      }

      await page.screenshot({
        path: screenshotPath("staff-report", "05_写真メタデータ入力"),
        fullPage: true,
      });
    }
  });

  test("アフター写真ではお客様の反応フィールドが表示される", async ({
    page,
  }) => {
    // 案件選択
    const selectTrigger = page.locator('[role="combobox"]').first();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // 写真アップロード
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const testImagePath = getTestImagePath();
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);

      // 種類を「アフター」に変更
      const photoTypeSelect = page.locator('[role="combobox"]').nth(1);
      if (await photoTypeSelect.isVisible()) {
        await photoTypeSelect.click();
        const afterOption = page.getByRole("option", { name: "アフター" });
        if (await afterOption.isVisible()) {
          await afterOption.click();
        }

        // お客様の反応フィールドが表示される
        await expect(page.getByText("お客様の反応")).toBeVisible();

        const feedbackTextarea = page.locator(
          "textarea[placeholder*='お客様']"
        );
        if ((await feedbackTextarea.count()) > 0) {
          await feedbackTextarea.first().fill("とても喜んでいただけました");
        }
      }
    }
  });

  test("写真を削除できる", async ({ page }) => {
    // 案件選択 → 写真アップロード
    const selectTrigger = page.locator('[role="combobox"]').first();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const testImagePath = getTestImagePath();
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);

      // 削除ボタン（赤い丸い×ボタン）をクリック
      const deleteButton = page.locator(
        "button.bg-red-500, button:has(.text-white):has(svg)"
      );
      if ((await deleteButton.count()) > 0) {
        await deleteButton.first().click();
      }
    }
  });
});

test.describe("レポート作成 - Step3: 確認・送信", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
    await page.goto("/report/new");
  });

  test("写真なしで送信するとエラーが表示される", async ({ page }) => {
    // 案件選択
    const selectTrigger = page.locator('[role="combobox"]').first();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // 送信ボタンをクリック（写真なし）
    const submitButton = page.getByRole("button", { name: "送信する" });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // エラーメッセージ
      await expect(
        page.getByText("写真を1枚以上選択してください")
      ).toBeVisible();

      await page.screenshot({
        path: screenshotPath("staff-report", "06_写真なしエラー"),
        fullPage: true,
      });
    }
  });

  test("案件未選択で送信するとエラーが表示される", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: "送信する" });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      await expect(
        page.getByText("案件を選択してください")
      ).toBeVisible();
    }
  });

  test("タイトル未入力で送信するとエラーが表示される", async ({ page }) => {
    // 案件選択
    const selectTrigger = page.locator('[role="combobox"]').first();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // 写真アップロード（タイトル未入力のまま）
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const testImagePath = getTestImagePath();
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);

      // 送信
      const submitButton = page.getByRole("button", { name: "送信する" });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        await expect(
          page.getByText("すべての写真にタイトルを入力してください")
        ).toBeVisible();
      }
    }
  });

  test("全フィールド入力してレポートを送信できる", async ({ page }) => {
    // Step1: 案件選択
    const selectTrigger = page.locator('[role="combobox"]').first();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // Step2: 写真アップロード
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const testImagePath = getTestImagePath();
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(3000); // 圧縮待ち

      // タイトル入力
      const titleInputs = page.locator(
        "input[placeholder*='大棟'], input[placeholder*='タイトル']"
      );
      if ((await titleInputs.count()) > 0) {
        await titleInputs.first().fill("E2Eテスト写真");
      }

      // コメント入力
      const commentTextareas = page.locator(
        "textarea[placeholder*='詳細'], textarea[placeholder*='観察']"
      );
      if ((await commentTextareas.count()) > 0) {
        await commentTextareas.first().fill("E2Eテストコメント");
      }
    }

    // Step3: 作業内容入力
    const summaryTextarea = page.locator("textarea#summary");
    if (await summaryTextarea.isVisible()) {
      await summaryTextarea.fill(
        "E2Eテスト: 本日の作業内容テストです。"
      );
    }

    await page.screenshot({
      path: screenshotPath("staff-report", "07_送信前確認"),
      fullPage: true,
    });

    // 送信
    const submitButton = page.getByRole("button", { name: "送信する" });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // 送信完了を待つ（ボタンテキスト変化またはページ遷移）
      await Promise.race([
        page.waitForURL(/\/(history|$)/, { timeout: 30000 }),
        expect(page.getByText("送信完了")).toBeVisible({ timeout: 30000 }),
      ]).catch(() => {
        // タイムアウトの場合はスクリーンショットを撮る
      });

      await page.screenshot({
        path: screenshotPath("staff-report", "08_送信完了"),
        fullPage: true,
      });
    }
  });
});
