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

/** Changes to the wiki's text that this site makes on purpose. None right now: the wiki caught up with every earlier edit. */
export const OVERRIDES: Override[] = [];
