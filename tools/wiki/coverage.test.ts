import { describe, expect, it } from "vitest";
import { coverage, sectionOf } from "./coverage";
import type { WikiKind } from "../../src/guide/wiki";

const page = (id: string, kind: WikiKind) => ({ id, kind });
const WANTED: WikiKind[] = ["character", "book"];

describe("sectionOf", () => {
  it("groups pages by their first two path segments", () => {
    expect(sectionOf("people/characters/girl2")).toBe("people/characters");
    expect(sectionOf("event/ends/index")).toBe("event/ends");
    expect(sectionOf("other/guide/mechanism/dream-sweetheart")).toBe("other/guide");
  });

  it("keeps a single page that sits directly in a folder as its own section", () => {
    expect(sectionOf("system/skill")).toBe("system/skill");
    expect(sectionOf("index")).toBe("index");
  });
});

describe("coverage", () => {
  it("counts converted pages per section", () => {
    const r = coverage([page("people/characters/a", "character"), page("people/characters/b", "character"), page("system/books/x", "book")], WANTED, {});
    expect(r.rows).toEqual([
      { section: "people/characters", total: 2, converted: 2, excludedReason: undefined },
      { section: "system/books", total: 1, converted: 1, excludedReason: undefined },
    ]);
    expect(r.unregistered).toEqual([]);
  });

  it("accepts an unconverted section only when it is registered with a reason", () => {
    const pages = [page("other/news/1", "other"), page("other/qna/1", "other")];
    const r = coverage(pages, WANTED, { "other/news": "官方公告" });
    expect(r.unregistered).toEqual(["other/qna"]);
    expect(r.rows.find((x) => x.section === "other/news")).toMatchObject({ converted: 0, excludedReason: "官方公告" });
  });

  it("reports a section whose pages are only partly converted", () => {
    const pages = [page("people/characters/a", "character"), page("people/characters/b", "other")];
    const r = coverage(pages, WANTED, {});
    expect(r.unregistered).toEqual(["people/characters"]);
  });

  it("flags a registered exclusion that no longer matches any page", () => {
    const r = coverage([page("people/characters/a", "character")], WANTED, { "other/gone": "舊的" });
    expect(r.staleExclusions).toEqual(["other/gone"]);
  });
});
