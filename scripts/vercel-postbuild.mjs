import { renameSync, mkdirSync, existsSync } from "node:fs";

if (existsSync("dist/client")) {
  renameSync("dist/client", "dist/static");
}
if (existsSync("dist/server")) {
  mkdirSync("dist/functions", { recursive: true });
  renameSync("dist/server", "dist/functions/__server.func");
}

console.log("✅ Vercel postbuild: renamed client → static, server → functions/__server.func");