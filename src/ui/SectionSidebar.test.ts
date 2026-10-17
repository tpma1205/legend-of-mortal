import { describe, expect, it } from "vitest";
import { groupsOf } from "./SectionSidebar";
import { SECTIONS } from "./sections";
import { buildWikiIndex } from "../guide/wikiIndex";
import type { Block, WikiPage } from "../guide/wiki";

const source = { site: "活俠傳 wiki", url: "https://smilin.net/LoM-wiki/", license: "CC BY-NC-SA 4.0", commit: "abc", version: "v1", date: "2026-10-17" };
const cell = (text: string) => [[{ text }]];
const overview: WikiPage = {
  id: "event/ends/index",
  kind: "ending",
  title: "汗青書",
  tags: [],
  blocks: [{ type: "table", rows: [["編號", "名稱"], ["結局 1", "回疆隱居"], ["結局 2", "毀滅性聲波攻擊"]].map((r) => r.map(cell)) } as Block],
};
const detail: WikiPage = { id: "event/ends/end-2", kind: "ending", title: "汗青書2：毀滅性聲波攻擊", tags: [], blocks: [{ type: "p", text: [{ text: "內文" }] }] };
const index = buildWikiIndex([{ source, skipped: [], pages: [overview, detail] }]);
const section = SECTIONS.find((s) => s.id === "endings")!;

describe("groupsOf (結局系列)", () => {
  it("lists every wiki-numbered entry, with or without a detail page", () => {
    const g = groupsOf(index, section, index.pages, "").find((x) => x.label === "汗青書")!;
    expect(g.items.map((i) => [i.label, i.missing ?? false])).toEqual([
      ["汗青書總表", false],
      ["汗青書1：回疆隱居", true],
      ["汗青書2：毀滅性聲波攻擊", false],
    ]);
  });

  it("filters entries that have no detail page too", () => {
    const groups = groupsOf(index, section, index.pages, "回疆");
    expect(groups.flatMap((g) => g.items.map((i) => i.label))).toEqual(["汗青書1：回疆隱居"]);
  });
});
