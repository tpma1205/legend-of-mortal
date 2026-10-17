import { describe, expect, it } from "vitest";
import { applyOverrides, type Override } from "./overrides";
import type { WikiPage } from "../../src/guide/wiki";

const page = (): WikiPage => ({
  id: "people/dream-sweetheart",
  kind: "pursuit",
  title: "夢境心上人",
  tags: [],
  blocks: [
    { type: "h", level: 2, text: [{ text: "備註" }] },
    {
      type: "list",
      ordered: false,
      items: [
        { depth: 0, text: [{ text: "目前可攻略角色為唐默鈴。" }] },
        { depth: 0, text: [{ text: "預計更新順序：一是葉雲裳。" }] },
        { depth: 0, text: [{ text: "那年代女子以留長髮為美。" }] },
      ],
    },
  ],
});

const override: Override = {
  pageId: "people/dream-sweetheart",
  edit: "更正備註",
  replace: [{ startsWith: "預計更新順序", with: [[{ text: "葉雲裳已開放。" }], [{ text: "其餘依序開放。" }]] }],
};

describe("applyOverrides", () => {
  it("replaces the matching list item and records what was changed", () => {
    const [out] = applyOverrides([page()], [override]);
    const list = out.blocks[1];
    expect(list.type === "list" && list.items.map((i) => i.text[0].text)).toEqual(["目前可攻略角色為唐默鈴。", "葉雲裳已開放。", "其餘依序開放。", "那年代女子以留長髮為美。"]);
    expect(out.edits).toEqual(["更正備註"]);
  });

  it("leaves other pages untouched", () => {
    const other: WikiPage = { ...page(), id: "other/page" };
    expect(applyOverrides([other], [override])).toEqual([other]);
  });

  it("fails loudly when the wiki text it was written against has changed", () => {
    const changed = page();
    (changed.blocks[1] as { items: { text: { text: string }[] }[] }).items[1].text[0].text = "完全不同的內容";
    expect(() => applyOverrides([changed], [override])).toThrow(/預計更新順序/);
  });
});
