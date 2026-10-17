import { describe, expect, it } from "vitest";
import { buildWikiIndex } from "./wikiIndex";
import { getWikiSearch } from "./wikiSearch";
import type { WikiPage } from "./wiki";

const source = { site: "活俠傳 wiki", url: "https://smilin.net/LoM-wiki/", license: "CC BY-NC-SA 4.0", commit: "abc", version: "v1", date: "2026-10-17" };
const page = (id: string, title: string, text: string): WikiPage => ({ id, kind: "book", title, tags: [], blocks: [{ type: "p", text: [{ text }] }] });
const index = buildWikiIndex([{ source, skipped: [], pages: [page("a", "金剛腿", "嵩山派硬功"), page("b", "同舟劍譜", "點蒼派劍法"), page("c", "太祖長拳", "拳法")] }]);

describe("wiki search", () => {
  it("finds pages by title", async () => {
    const search = await getWikiSearch(index);
    expect(search("金剛").map((h) => h.page.id)).toEqual(["a"]);
  });

  it("finds pages from a single character", async () => {
    const search = await getWikiSearch(index);
    expect(search("劍").map((h) => h.page.id)).toContain("b");
  });

  it("converts simplified input to traditional", async () => {
    const search = await getWikiSearch(index);
    expect(search("金刚腿").map((h) => h.page.id)).toEqual(["a"]);
  });

  it("returns nothing for an empty query", async () => {
    const search = await getWikiSearch(index);
    expect(search("  ")).toEqual([]);
  });

  it("builds the index once per wiki index", async () => {
    expect(await getWikiSearch(index)).toBe(await getWikiSearch(index));
  });
});
