import { describe, expect, it } from "vitest";
import { buildWikiIndex } from "./wikiIndex";
import type { WikiDataset, WikiPage } from "./wiki";

const source = { site: "活俠傳 wiki", url: "https://smilin.net/LoM-wiki/", license: "CC BY-NC-SA 4.0", commit: "abc", version: "v1", date: "2026-10-17" };
const p = (id: string, title: string, kind: WikiPage["kind"], text = "內文"): WikiPage => ({
  id,
  kind,
  title,
  tags: [],
  blocks: [{ type: "p", text: [{ text }] }],
});
const dataset = (...pages: WikiPage[]): WikiDataset => ({ source, pages, skipped: [] });

describe("buildWikiIndex", () => {
  it("indexes pages by id and kind", () => {
    const idx = buildWikiIndex([dataset(p("people/characters/girl2", "葉雲裳", "character"), p("system/books/book_1", "金剛腿", "book"))]);
    expect(idx.byId.get("system/books/book_1")?.title).toBe("金剛腿");
    expect(idx.ofKind("character").map((x) => x.title)).toEqual(["葉雲裳"]);
  });

  it("rejects the same page id in two datasets", () => {
    const a = dataset(p("a/b", "甲", "other"));
    expect(() => buildWikiIndex([a, a])).toThrow(/duplicate page id: a\/b/);
  });

  it("resolves page ids and @name references", () => {
    const idx = buildWikiIndex([dataset(p("people/characters/girl2", "葉雲裳", "character"), p("event/pursuit/index", "夢境心上人", "pursuit"))]);
    expect(idx.resolve("people/characters/girl2")).toBe("people/characters/girl2");
    expect(idx.resolve("@葉雲裳")).toBe("people/characters/girl2");
    expect(idx.resolve("event/pursuit/")).toBe("event/pursuit/index");
    expect(idx.resolve("@不存在")).toBeUndefined();
    expect(idx.resolve(undefined)).toBeUndefined();
  });

  it("prefers a character over another page with the same name", () => {
    const idx = buildWikiIndex([dataset(p("event/ends/end-1", "唐惟元", "ending"), p("people/characters/x", "唐惟元", "character"))]);
    expect(idx.resolve("@唐惟元")).toBe("people/characters/x");
  });

  it("lists links that point nowhere, once each", () => {
    const page: WikiPage = {
      id: "a",
      kind: "other",
      title: "A",
      tags: [],
      blocks: [{ type: "p", text: [{ text: "x", to: "missing/page" }, { text: "y", to: "missing/page" }, { text: "z", to: "@無名氏" }] }],
    };
    expect(buildWikiIndex([dataset(page)]).unresolved).toEqual(["@無名氏", "missing/page"]);
  });

  it("lists which pages link to a page (excluding itself), each once", () => {
    const link = (to: string): WikiPage["blocks"] => [{ type: "p", text: [{ text: "x", to }, { text: "y", to }] }];
    const a: WikiPage = { id: "a", kind: "other", title: "A", tags: [], blocks: link("b") };
    const b: WikiPage = { id: "b", kind: "other", title: "B", tags: [], blocks: link("b") };
    const c: WikiPage = { id: "c", kind: "character", title: "C", tags: [], blocks: link("@B") };
    const idx = buildWikiIndex([dataset(a, b, c)]);
    expect(idx.backlinks.get("b")).toEqual(["a", "c"]);
    expect(idx.backlinks.has("a")).toBe(false);
  });
});

