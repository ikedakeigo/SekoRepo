import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // テストファイルをe2eディレクトリに配置
  testDir: "./e2e",
  // 並列実行を有効にする
  fullyParallel: true,
  // CI環境ではテストの失敗を許可しない
  forbidOnly: !!process.env.CI,
  // CI環境ではテストのリトライを2回に設定
  retries: process.env.CI ? 2 : 0,
  // CI環境ではワーカー数を1に設定
  workers: process.env.CI ? 1 : "50%", // デフォルト動作を明示
  // HTMLレポーターを使用
  reporter: process.env.CI
  ? [["github"], ["html", { open: "never" }]] // GitHub ActionsならGitHub reporter
  : [["html", { open: "on-failure" }]],       // ローカルは失敗時に自動オープン
  // テストの実行前にブラウザを起動するための設定
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  // スクリーンショットの保存先
  snapshotDir: "./e2e/screenshots",
  // テストプロジェクトの設定
  projects: [
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  },
  // {
  //   name: "firefox",
  //   use: { ...devices["Desktop Firefox"] },
  // },
  // {
  //   name: "webkit",
  //   use: { ...devices["Desktop Safari"] },
  // },
],
  // 開発サーバーの設定
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // ← 追加推奨（120秒）
  },
});
