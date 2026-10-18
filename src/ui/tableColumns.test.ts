import { describe, expect, it } from "vitest";
import { columnMinWidths, visibleColumns } from "./tableColumns";
import type { Inline } from "../guide/wiki";

const cell = (text: string): Inline[][] => (text === "" ? [] : [[{ text }]]);
const row = (...t: string[]) => t.map(cell);

describe("visibleColumns", () => {
  it("drops a column whose body cells are all empty or a dash", () => {
    const rows = [row("觸發條件", "事件內容", "備註"), row("-", "很長的事件說明", "-"), row("", "另一段說明", "")];
    expect(visibleColumns(rows, true)).toEqual([1]);
  });

  it("keeps a column as soon as one body cell has content", () => {
    const rows = [row("觸發條件", "事件內容"), row("-", "說明"), row("好感≧25", "說明二")];
    expect(visibleColumns(rows, true)).toEqual([0, 1]);
  });

  it("does not look at the header row when deciding", () => {
    const rows = [row("備註", "內容"), row("-", "x")];
    expect(visibleColumns(rows, true)).toEqual([1]);
  });

  it("without a header every row counts as body", () => {
    const rows = [row("-", "甲"), row("-", "乙")];
    expect(visibleColumns(rows, false)).toEqual([1]);
  });

  it("never hides every column, and keeps all of a table with no body rows", () => {
    expect(visibleColumns([row("-", "-"), row("-", "-")], false)).toEqual([0, 1]);
    expect(visibleColumns([row("甲", "乙")], true)).toEqual([0, 1]);
  });

  it("treats full-width dashes and surrounding spaces as empty", () => {
    const rows = [row("A", "B"), row(" － ", "x")];
    expect(visibleColumns(rows, true)).toEqual([1]);
  });
});

describe("columnMinWidths", () => {
  it("gives every column room for its longest line, capped so one column cannot take the page", () => {
    const rows = [row("名稱", "說明", "取得"), row("唐門小劍", "字".repeat(40), "字".repeat(14))];
    expect(columnMinWidths(rows, [0, 1, 2])).toEqual([6, 18, 16]);
  });

  it("keeps short and numeric columns narrow but never a single-character sliver", () => {
    expect(columnMinWidths([row("0", "1"), row("10%", "2")], [0, 1])).toEqual([5, 3]);
  });

  it("measures the longest line of a cell, not the whole cell", () => {
    const cell3: Inline[][] = [[{ text: "字".repeat(8) }], [{ text: "字".repeat(8) }], [{ text: "字".repeat(8) }]];
    expect(columnMinWidths([[cell3]], [0])).toEqual([10]);
  });
});
