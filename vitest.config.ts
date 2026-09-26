import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://kickoff:kickoff@localhost:5432/kickoff",
      SESSION_SECRET: "test-session-secret-min-32-characters-long",
      APP_BASE_URL: "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
