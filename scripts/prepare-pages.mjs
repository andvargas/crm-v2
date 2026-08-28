import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const clientDir = resolve(projectRoot, "dist/client");
const serverDir = resolve(projectRoot, "dist/server");
const pagesDir = resolve(projectRoot, "dist/pages");
const workerModulesDir = resolve(pagesDir, "_worker_modules");

// The Cloudflare Vite plugin leaves a Workers-only Wrangler redirect behind.
// Pages must read the source-controlled root configuration instead.
rmSync(resolve(projectRoot, ".wrangler/deploy"), { recursive: true, force: true });

rmSync(pagesDir, { recursive: true, force: true });
mkdirSync(pagesDir, { recursive: true });
cpSync(clientDir, pagesDir, { recursive: true });
cpSync(serverDir, workerModulesDir, { recursive: true });

writeFileSync(
  resolve(pagesDir, "_worker.js"),
  `import app from "./_worker_modules/index.js";

export default {
  async fetch(request, env, ctx) {
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;
    return app.fetch(request, env, ctx);
  },
};
`,
);

const assetsIgnorePath = resolve(pagesDir, ".assetsignore");
const existingIgnore = readFileSync(assetsIgnorePath, "utf8").trimEnd();
writeFileSync(
  assetsIgnorePath,
  `${existingIgnore}\n_worker.js\n_worker_modules/**\n`,
);

console.log("Prepared Cloudflare Pages output in dist/pages");
