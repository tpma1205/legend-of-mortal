import { describe, expect, it } from "vitest";
import { splitAchievements } from "./achievements";
import type { Block, WikiPage } from "../../src/guide/wiki";

const cell = (...lines: string[]) => lines.map((l) => [{ text: l }]);
const header = ["編號", "成就", "成就描述", "解鎖條件", "解鎖特性", "備註"].map((t) => cell(t));
const overview: WikiPage = {
  id: "event/achievements/index",
  kind: "achievement",
  title: "風雲史",
  tags: [],
  blocks: [
    { type: "p", text: [{ text: "說明" }] },
    {
      type: "table",
      rows: [header, [cell("00"), cell("命中有數"), cell("坦然走到這裡"), cell("完成一周目。", "•退隱線所有結局"), cell("命運+2"), cell()], [cell("01"), cell("師門砥柱"), cell("師弟妹們信賴你"), cell("擊殺金烏上人"), cell(), cell("備註文字")]],
    } as Block,
  ],
};

describe("splitAchievements", () => {
  const { pages, overview: patched } = splitAchievements(overview);

  it("makes one page per table row, numbered like the wiki's own rows", () => {
    expect(pages.map((p) => [p.id, p.title, p.kind])).toEqual([
      ["event/achievements/ach-0", "風雲史0：命中有數", "achievement"],
      ["event/achievements/ach-1", "風雲史1：師門砥柱", "achievement"],
    ]);
  });

  it("puts the description first, then each filled-in column under its own heading", () => {
    const heads = (p: WikiPage) => p.blocks.filter((b) => b.type === "h").map((b) => (b as { text: { text: string }[] }).text[0].text);
    expect(pages[0].blocks[0]).toEqual({ type: "p", text: [{ text: "坦然走到這裡" }] });
    expect(heads(pages[0])).toEqual(["解鎖條件", "解鎖特性"]);
    expect(heads(pages[1])).toEqual(["解鎖條件", "備註"]);
  });

  it("says on the page that this site split it out of the wiki's table", () => {
    expect(pages[0].edits?.[0]).toMatch(/本站/);
  });

  it("remembers which wiki page it came from, since the wiki has none of its own", () => {
    expect(pages.every((p) => p.derivedFrom === "event/achievements/index")).toBe(true);
  });

  it("links each name in the overview table to its page", () => {
    const table = patched.blocks.find((b) => b.type === "table") as Extract<Block, { type: "table" }>;
    expect(table.rows[1][1][0][0]).toEqual({ text: "命中有數", to: "event/achievements/ach-0" });
  });
});
