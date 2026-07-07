import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages のサブパスに対応する。
  // CI 環境では VITE_BASE_PATH にリポジトリ名が入る（例: /odds-calculator/）。
  // ローカル開発時は '/' のまま動作する。
  base: process.env.VITE_BASE_PATH ?? "/",
});
