import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

// eslint-config-next 15.5.x masih mengekspor config legacy (eslintrc),
// bukan flat config — jadi dipakai lewat FlatCompat (pola resmi Next 15).
// (@eslint/eslintrc dideklarasikan eksplisit di devDependencies.)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", ".open-next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
