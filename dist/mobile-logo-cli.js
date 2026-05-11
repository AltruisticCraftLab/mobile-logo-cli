#!/usr/bin/env bun
// @bun

// scripts/mobile-logo-cli.ts
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
var ensureDir = (dir) => {
  if (!existsSync(dir))
    mkdirSync(dir, { recursive: true });
};
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var downloadFile = async (url, dest, retries = 3) => {
  for (let attempt = 1;attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        if (attempt < retries) {
          const waitTime = attempt * 5000;
          console.log(`\u23F3 Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt}/${retries}...`);
          await sleep(waitTime);
          continue;
        }
        throw new Error("Rate limit exceeded after retries");
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const content = await response.text();
      if (content.includes("404") && content.length < 1000) {
        throw new Error("File not found (404)");
      }
      await Bun.write(dest, content);
      console.log(`\u2705 Saved: ${dest}`);
      return;
    } catch (err) {
      if (attempt === retries) {
        console.error(`\u274C Failed to download from ${url}`);
        console.error(`   Error: ${err instanceof Error ? err.message : err}`);
        throw err;
      }
    }
  }
};
var fileUrl = `https://cdn.jsdelivr.net/gh/AltruisticCraftLab/mobile-starter-snippets@main/logo/logo.tsx`;
var outputArg = process.argv.find((a) => a.startsWith("--output="))?.split("=")[1];
var targetDir = outputArg ? join(process.cwd(), outputArg) : join(process.cwd(), "src/components/shared");
var targetPath = join(targetDir, "logo.tsx");
ensureDir(targetDir);
console.log(`\u2B07\uFE0F Downloading logo.tsx...`);
if (existsSync(targetPath)) {
  console.log(`\u23ED\uFE0F Skipped (already exists): logo.tsx`);
  console.log("\uD83C\uDF89 Done!");
} else {
  try {
    await downloadFile(fileUrl, targetPath);
    console.log("\uD83C\uDF89 Done! Logo downloaded successfully.");
  } catch (err) {
    console.log("\u274C Download failed.");
    process.exit(1);
  }
}
