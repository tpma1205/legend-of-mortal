/**
 * Convert a local checkout of the 活俠傳 wiki (Markdown) into data/wiki/<kind>.json.
 *
 *   npx tsx tools/wiki/run.ts <path-to-wiki-docs> [commit] [version]
 *
 * The wiki is CC BY-NC-SA 4.0 (see docs/adr/0001-follow-wiki-license.md).
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { convertPage } from "./convert";
import type { WikiDataset, WikiKind, WikiPage } from "../../src/guide/wiki";

const [docsDir, commit = "unknown", version = "v1.0.3130"] = process.argv.slice(2);
if (!docsDir) {
  console.error("usage: tsx tools/wiki/run.ts <wiki docs dir> [commit] [version]");
  process.exit(1);
}

const SKIP_DIRS = new Set(["en", "ja", "zh-hans", "develop", "public", ".vitepress", "node_modules"]);
const WANTED: WikiKind[] = ["character", "book", "skill", "item", "pill", "ending", "badend", "achievement", "pursuit", "event"];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, out);
    } else if (name.endsWith(".md")) out.push(full);
  }
  return out;
}

const pages: WikiPage[] = [];
const skipped: WikiDataset["skipped"] = [];
for (const file of walk(docsDir)) {
  const id = relative(docsDir, file).replace(/\\/g, "/").replace(/\.md$/, "");
  try {
    const page = convertPage(id, readFileSync(file, "utf8"));
    if (!WANTED.includes(page.kind)) continue;
    if (page.blocks.length === 0) skipped.push({ id, reason: "no content blocks" });
    else pages.push(page);
  } catch (e) {
    skipped.push({ id, reason: String(e) });
  }
}

const source = {
  site: "活俠傳 wiki",
  url: "https://smilin.net/LoM-wiki/",
  license: "CC BY-NC-SA 4.0",
  commit,
  version,
  date: new Date().toISOString().slice(0, 10),
};

const outDir = join(import.meta.dirname, "../../data/wiki");
mkdirSync(outDir, { recursive: true });
const byKind = new Map<WikiKind, WikiPage[]>();
for (const p of pages) byKind.set(p.kind, [...(byKind.get(p.kind) ?? []), p]);
for (const [kind, list] of byKind) {
  const dataset: WikiDataset = { source, pages: list.sort((a, b) => a.id.localeCompare(b.id)), skipped: [] };
  writeFileSync(join(outDir, `${kind}.json`), JSON.stringify(dataset) + "\n");
  console.log(`${kind}: ${list.length} pages`);
}
writeFileSync(join(outDir, "_skipped.json"), JSON.stringify({ source, skipped }, null, 2) + "\n");
console.log(`skipped: ${skipped.length}`);
