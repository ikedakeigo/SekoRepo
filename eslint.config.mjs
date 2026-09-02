import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma 自動生成コード
    "src/generated/**",
    // ドキュメント・デザインプロトタイプ
    "docs/**",
    // Claude Code フックスクリプト
    ".claude/**",
  ]),
]);

export default eslintConfig;
