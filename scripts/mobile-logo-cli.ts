#!/usr/bin/env bun
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

// === Utilities ===
const ensureDir = (dir: string) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const downloadFile = async (url: string, dest: string, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        if (attempt < retries) {
          const waitTime = attempt * 5000;
          console.log(
            `⏳ Rate limited. Waiting ${
              waitTime / 1000
            }s before retry ${attempt}/${retries}...`
          );
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
      console.log(`✅ Saved: ${dest}`);
      return;
    } catch (err) {
      if (attempt === retries) {
        console.error(`❌ Failed to download from ${url}`);
        console.error(`   Error: ${err instanceof Error ? err.message : err}`);
        throw err;
      }
    }
  }
};

// === Main ===
const fileUrl = `https://cdn.jsdelivr.net/gh/AltruisticCraftLab/mobile-starter-snippets@main/logo/logo.tsx`;

const outputArg = process.argv
  .find((a) => a.startsWith("--output="))
  ?.split("=")[1];
const targetDir = outputArg
  ? join(process.cwd(), outputArg)
  : join(process.cwd(), "src/components/shared");

const targetPath = join(targetDir, "logo.tsx");

ensureDir(targetDir);

console.log(`⬇️ Downloading logo.tsx...`);

if (existsSync(targetPath)) {
  console.log(`⏭️ Skipped (already exists): logo.tsx`);
  console.log("🎉 Done!");
} else {
  try {
    await downloadFile(fileUrl, targetPath);
    console.log("🎉 Done! Logo downloaded successfully.");
  } catch (err) {
    console.log("❌ Download failed.");
    process.exit(1);
  }
}
