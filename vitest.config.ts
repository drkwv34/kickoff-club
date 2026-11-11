import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/__tests__/**/*.ts",
      "src/**/__tests__/**/*.tsx",
    ],
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://kickoff:kickoff@localhost:5432/kickoff",
      SESSION_SECRET: "test-session-secret-min-32-characters-long",
      APP_BASE_URL: "http://localhost:3000",
      AUTH_RATE_LIMIT_MAX: "10000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
