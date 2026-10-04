import { cpSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

const standaloneDir = ".next/standalone";
if (!existsSync(standaloneDir)) {
  console.error("Missing .next/standalone — run pnpm build first.");
  process.exit(1);
}

cpSync(".next/static", `${standaloneDir}/.next/static`, { recursive: true });
if (existsSync("public")) {
  cpSync("public", `${standaloneDir}/public`, { recursive: true });
}

const child = spawn("node", [`${standaloneDir}/server.js`], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 1));
