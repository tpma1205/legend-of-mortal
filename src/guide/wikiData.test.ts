import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { endingEntries } from "./endingList";
import { inlinesOf, buildWikiIndex } from "./wikiIndex";
import type { WikiDataset, WikiPage } from "./wiki";

/** The converted wiki as committed in data/wiki. These checks catch what the converter gets wrong. */
const dir = join(import.meta.dirname, "../../data/wiki");
const datasets: WikiDataset[] = readdirSync(dir)
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
const index = buildWikiIndex(datasets);

const textOf = (page: WikiPage): string =>
  page.blocks
    .map((b) => (b.type === "code" ? `[code]${b.text}` : b.type === "hr" ? "" : inlinesOf(b).map((r) => r.text).join("")))
    .join("\n");

/** raw markup that should never reach a reader */
const LEFTOVER: Record<string, RegExp> = {
  "code fence": /```/,
  "mermaid source": /mermaid|-->|%%/,
  "[[wiki link]]": /\[\[|\]\]/,
  "markdown link": /\]\(/,
  "vue placeholder": /\{\{|\}\}/,
  "container marker": /^:::/m,
  "footnote marker": /\[\^/,
  "raw html tag": /<\/?[A-Za-z][^>]*>/,
  "strike marker": /~~/,
  "spoiler marker": /\|\|/,
  "bold marker": /\*\*/,
  "heading marker": /^#{1,6}\s/m,
};

describe("data/wiki", () => {
  it("has no raw markup left in any page", () => {
    const found: string[] = [];
    for (const page of index.pages) {
      const text = textOf(page);
      for (const [name, re] of Object.entries(LEFTOVER)) if (re.test(text)) found.push(`${page.id}: ${name}`);
    }
    expect(found).toEqual([]);
  });

  it("links to every converted section resolve (only links to sections we skip may dangle)", () => {
    // links that are broken in the wiki itself: the target page does not exist upstream
    const brokenUpstream = new Set(["event/simple/2-04-1-練功分心"]);
    const converted = new Set(index.pages.map((p) => p.id.split("/").slice(0, 2).join("/")));
    const dangling = index.unresolved.filter((to) => !to.startsWith("@") && !brokenUpstream.has(to) && converted.has(to.split("/").slice(0, 2).join("/")));
    expect(dangling).toEqual([]);
  });

  it("lists every 汗青書 and 生死簿 number from the wiki's index, without gaps", () => {
    for (const [kind, dirName, prefix, noun, min] of [
      ["ending", "event/ends", "end-", "汗青書", 54],
      ["badend", "event/badends", "badend-", "生死簿", 105],
    ] as const) {
      const nos = endingEntries(index.byId.get(`${dirName}/index`), index.ofKind(kind), prefix, noun).map((e) => e.no);
      expect(nos.length).toBeGreaterThanOrEqual(min);
      expect(nos).toEqual(Array.from({ length: nos.length }, (_, i) => i + 1));
    }
  });

  it("gives every page a title and some content", () => {
    expect(index.pages.filter((p) => !p.title || p.blocks.length === 0).map((p) => p.id)).toEqual([]);
  });

  it("keeps portrait paths on most character pages, and only on character pages", () => {
    const withImage = index.pages.filter((p) => p.image);
    expect(withImage.every((p) => p.kind === "character")).toBe(true);
    expect(withImage.length).toBeGreaterThanOrEqual(90);
  });

  it("covers every area the site promises", () => {
    const kinds = new Set(index.pages.map((p) => p.kind));
    for (const k of ["character", "book", "skill", "item", "pill", "forge", "mechanism", "ending", "badend", "achievement", "pursuit", "event", "lore"]) {
      expect(kinds.has(k as never), `kind ${k}`).toBe(true);
    }
  });
});
