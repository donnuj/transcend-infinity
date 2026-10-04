import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["lib/**/__tests__/**/*.{test,spec}.{ts,tsx}", "app/**/__tests__/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./lib/__tests__/setup.ts"],
    pool: "vmThreads",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
