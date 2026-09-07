import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(projectRoot, "lib", "supabase", "database.types.ts");
const supabaseCli = path.join(
  projectRoot,
  "node_modules",
  "supabase",
  "dist",
  "supabase.js",
);
const checkOnly = process.argv.includes("--check");

const result = spawnSync(
  process.execPath,
  [supabaseCli, "gen", "types", "typescript", "--local"],
  {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  },
);

if (result.error) {
  console.error(`Không thể chạy Supabase CLI: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0 || !result.stdout.trim()) {
  console.error("Không thể sinh Supabase types từ database cục bộ.");
  process.exit(result.status || 1);
}

const normalize = (value) => value.replace(/\r\n/g, "\n").trimEnd() + "\n";
const generatedTypes = normalize(result.stdout);

if (checkOnly) {
  const currentTypes = normalize(readFileSync(outputPath, "utf8"));

  if (currentTypes !== generatedTypes) {
    console.error(
      "database.types.ts chưa đồng bộ với migrations. Hãy chạy: npm run types:db",
    );
    process.exit(1);
  }

  console.log("Supabase types đang đồng bộ với migrations.");
  process.exit(0);
}

writeFileSync(outputPath, generatedTypes, "utf8");
console.log("Đã cập nhật lib/supabase/database.types.ts.");
