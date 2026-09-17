import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:tailwindcss/recommended",
  ),
  {
    rules: {
      // prettier-plugin-tailwindcss가 클래스 순서 정렬을 이미 담당하므로 중복 경고 비활성화
      "tailwindcss/classnames-order": "off",
    },
  },
  // Prettier가 담당하는 포맷팅 규칙과 충돌하지 않도록 항상 마지막에 위치
  eslintConfigPrettier,
];

export default eslintConfig;
