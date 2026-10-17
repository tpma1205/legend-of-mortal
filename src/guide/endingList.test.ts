import { describe, expect, it } from "vitest";
import { endingEntries } from "./endingList";
import type { Block, WikiPage } from "./wiki";

const cell = (text: string) => [[{ text }]];
const table = (rows: string[][]): Block => ({ type: "table", rows: rows.map((r) => r.map(cell)) });
const index = (id: string, rows: string[][]): WikiPage => ({
  id,
  kind: id.includes("badends") ? "badend" : "ending",
  title: "總表",
  tags: [],
  blocks: [{ type: "p", text: [{ text: "前言" }] }, table([["編號", "名稱"], ...rows])],
});
const detail = (id: string, title: string): WikiPage => ({ id, kind: "ending", title, tags: [], blocks: [] });

describe("endingEntries", () => {
  it("lists every number from the wiki's index table, in order", () => {
    const idx = index("event/ends/index", [["結局 2", "乙"], ["結局 1", "甲"]]);
    const out = endingEntries(idx, [idx], "end-", "汗青書");
    expect(out.map((e) => [e.no, e.label])).toEqual([[1, "汗青書1：甲"], [2, "汗青書2：乙"]]);
  });

  it("links to the detail page when the wiki has one, and marks the rest as missing", () => {
    const idx = index("event/ends/index", [["結局 1", "甲"], ["結局 2", "乙"]]);
    const out = endingEntries(idx, [idx, detail("event/ends/end-2", "汗青書2：乙")], "end-", "汗青書");
    expect(out.map((e) => [e.no, e.pageId, e.missing])).toEqual([
      [1, undefined, true],
      [2, "event/ends/end-2", false],
    ]);
  });

  it("reads the 生死簿 spelling of the number cell", () => {
    const idx = index("event/badends/index", [["生死簿 No.12", "樣本"]]);
    expect(endingEntries(idx, [idx], "badend-", "生死簿")[0]).toMatchObject({ no: 12, label: "生死簿12：樣本" });
  });

  it("ignores rows without a number and a missing index page", () => {
    const idx = index("event/ends/index", [["說明", "無編號"]]);
    expect(endingEntries(idx, [idx], "end-", "汗青書")).toEqual([]);
    expect(endingEntries(undefined, [], "end-", "汗青書")).toEqual([]);
  });
});
