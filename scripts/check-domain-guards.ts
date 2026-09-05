import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function collectTsx(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTsx(path));
    else if (entry.isFile() && path.endsWith(".tsx")) files.push(path);
  }
  return files;
}

async function main() {
  const files = await collectTsx(join(process.cwd(), "src"));
  const violations: string[] = [];
  const rawSeverityInJsx = />\s*\{\s*[A-Za-z_$][\w$]*\.severity\s*\}\s*</;
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (rawSeverityInJsx.test(source)) violations.push(file);
  }
  if (violations.length > 0) throw new Error(`Sirovi severity render pronađen u: ${violations.join(", ")}. Koristi SEVERITY_META[severity].label.`);
  console.log(`Domain guards OK: pregledano ${files.length} TSX fajlova.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
