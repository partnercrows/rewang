import { renameSync, mkdirSync, existsSync, cpSync, rmSync } from "node:fs";

if (existsSync("dist/client")) {
  renameSync("dist/client", "dist/static");
}
if (existsSync("dist/server")) {
  mkdirSync("dist/functions", { recursive: true });
  renameSync("dist/server", "dist/functions/__server.func");
}

console.log("✅ Vercel postbuild: renamed client → static, server → functions/__server.func");

// Vercel CLI needs .vercel/output for --prebuilt deployment
const outDir = ".vercel/output";
if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true });
}
mkdirSync(outDir, { recursive: true });
cpSync("dist", outDir, { recursive: true });
console.log("✅ Vercel postbuild: copied dist → .vercel/output");
