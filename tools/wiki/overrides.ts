import type { Inline, WikiPage } from "../../src/guide/wiki";

/**
 * A change this site makes to a wiki page. Applied after every conversion so a re-sync keeps it,
 * and listed on the page itself (CC BY-SA requires saying what was modified).
 */
export interface Override {
  pageId: string;
  /** shown at the bottom of the page */
  edit: string;
  /** replace the list item whose text starts with `startsWith` by these items */
  replace: { startsWith: string; with: Inline[][] }[];
}

const textOf = (runs: Inline[]) => runs.map((r) => r.text).join("");

export function applyOverrides(pages: WikiPage[], overrides: Override[]): WikiPage[] {
  return pages.map((page) => {
    const mine = overrides.filter((o) => o.pageId === page.id);
    if (mine.length === 0) return page;
    let blocks = page.blocks;
    for (const o of mine) {
      for (const r of o.replace) {
        let found = false;
        blocks = blocks.map((b) => {
          if (b.type !== "list") return b;
          const items = b.items.flatMap((item) => {
            if (!textOf(item.text).startsWith(r.startsWith)) return [item];
            found = true;
            return r.with.map((text) => ({ depth: item.depth, text }));
          });
          return { ...b, items };
        });
        if (!found) throw new Error(`override for ${page.id}: no list item starts with 「${r.startsWith}」 (did the wiki change?)`);
      }
    }
    return { ...page, blocks, edits: mine.map((o) => o.edit) };
  });
}

/** Changes to the wiki's text that this site makes on purpose. */
export const OVERRIDES: Override[] = [
  {
    pageId: "people/dream-sweetheart",
    edit: "備註的第二點原寫「預計更新順序：一是葉雲裳…」，讀起來像葉雲裳尚未開放；已改為說明葉雲裳已可攻略，並補上《崆峒神威》更新（2026-10-15）的資訊。",
    replace: [
      {
        startsWith: "目前可攻略角色",
        with: [
          [
            { text: "目前可攻略角色為" },
            { text: "唐默鈴", to: "@唐默鈴" },
            { text: "、" },
            { text: "夏侯蘭", to: "@夏侯蘭" },
            { text: "、" },
            { text: "龍湘", to: "@龍湘" },
            { text: "、" },
            { text: "葉雲裳", to: "@葉雲裳" },
            { text: "（wiki 標註自 v1.0.5000 起）。" },
          ],
        ],
      },
      {
        startsWith: "預計更新順序",
        with: [
          [
            { text: "官方原定的開放順序為：一是" },
            { text: "葉雲裳", to: "@葉雲裳" },
            { text: "（已開放），二是" },
            { text: "虞小梅", to: "@虞小梅" },
            { text: "和" },
            { text: "郁竹", to: "@郁竹" },
            { text: "，三是" },
            { text: "魏菊", to: "@魏菊" },
            { text: "與" },
            { text: "上官螢", to: "@上官螢" },
            { text: "。" },
          ],
          [
            { text: "虞小梅、郁竹的結緣隨《崆峒神威》更新（官方公告延至 2026-10-15）開放；wiki 尚未收錄這兩位的結緣攻略，上方表格仍寫「目前版本無法攻略」。" },
          ],
        ],
      },
    ],
  },
];
