import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

function screenshotPath(testName: string, fileName: string): string {
  const dir = path.join(SCREENSHOT_DIR, testName);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${fileName}.png`);
}

test("01_ログインページが表示される", async ({ page }) => {
  const name = "01_ログインページが表示される";

  await page.goto("/login");
  await page.screenshot({ path: screenshotPath(name, "01_ログイン画面"), fullPage: true });

  await expect(page).toHaveURL(/login/);
});

test("02_未認証ユーザーはログインにリダイレクトされる", async ({ page }) => {
  const name = "02_未認証ユーザーはログインにリダイレクト";

  await page.goto("/");
  await page.screenshot({ path: screenshotPath(name, "01_リダイレクト後"), fullPage: true });

  await expect(page).toHaveURL(/login/);
});
