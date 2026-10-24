/**
 * Convert a local checkout of the 活俠傳 wiki (Markdown) into data/wiki/<kind>.json.
 *
 *   npx tsx tools/wiki/run.ts <path-to-wiki-docs> [version]
 *
 * The commit and its date are read from the git checkout, so re-running on an unchanged wiki gives identical files.
 *
 * The wiki is CC BY-NC-SA 4.0 (see docs/adr/0001-follow-wiki-license.md).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { convertPage, kindOf } from "./convert";
import { splitAchievements } from "./achievements";
import { coverage } from "./coverage";
import { EXCLUDED } from "./excluded";
import { OVERRIDES, applyOverrides } from "./overrides";
import type { WikiDataset, WikiKind, WikiPage } from "../../src/guide/wiki";

const [docsDir, versionArg] = process.argv.slice(2);
if (!docsDir) {
  console.error("usage: tsx tools/wiki/run.ts <wiki docs dir> [version]");
  process.exit(1);
}

const SKIP_DIRS = new Set(["en", "ja", "zh-hans", "develop", "public", ".vitepress", "node_modules"]);
const WANTED: WikiKind[] = ["character", "book", "skill", "item", "pill", "ending", "badend", "achievement", "pursuit", "event", "mechanism", "forge", "lore"];

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
const seen: { id: string; kind: WikiKind }[] = [];
const skipped: WikiDataset["skipped"] = [];
for (const file of walk(docsDir)) {
  const id = relative(docsDir, file).replace(/\\/g, "/").replace(/\.md$/, "");
  const kind = kindOf(id);
  seen.push({ id, kind });
  if (!WANTED.includes(kind)) continue;
  try {
    const page = convertPage(id, readFileSync(file, "utf8"));
    if (page.blocks.length === 0) skipped.push({ id, reason: "no content blocks" });
    else pages.push(page);
  } catch (e) {
    skipped.push({ id, reason: String(e) });
  }
}

// every wiki section is converted or excluded on purpose; print the table and stop on anything unaccounted for
const report = coverage(seen, WANTED, EXCLUDED);
console.log("section".padEnd(34), "pages  converted  excluded because");
for (const r of report.rows) console.log(r.section.padEnd(34), String(r.total).padStart(5), String(r.converted).padStart(10), " ", r.excludedReason ?? "");
if (report.unregistered.length || report.staleExclusions.length) {
  if (report.unregistered.length) console.error(`\nNOT CONVERTED AND NOT LISTED in tools/wiki/excluded.ts: ${report.unregistered.join(", ")}`);
  if (report.staleExclusions.length) console.error(`\nSTALE entries in tools/wiki/excluded.ts: ${report.staleExclusions.join(", ")}`);
  process.exit(1);
}

const edited = applyOverrides(pages, OVERRIDES);
pages.splice(0, pages.length, ...edited);

const achievements = pages.find((p) => p.id === "event/achievements/index");
if (achievements) {
  const split = splitAchievements(achievements);
  pages.splice(pages.indexOf(achievements), 1, split.overview, ...split.pages);
}

const git = (...args: string[]) => execFileSync("git", ["-C", docsDir, ...args], { encoding: "utf8" }).trim();
const commit = git("rev-parse", "--short", "HEAD");
const version = versionArg ?? "v1.0.3130";

const source = {
  site: "活俠傳 wiki",
  url: "https://smilin.net/LoM-wiki/",
  license: "CC BY-NC-SA 4.0",
  commit,
  version,
  date: git("log", "-1", "--format=%cs"),
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
