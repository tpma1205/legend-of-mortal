import Fuse from "fuse.js";
import * as OpenCC from "opencc-js/cn2t";
import type { Guide } from "./loadGuide";
import type { GuideEvent } from "./schema";

const toTraditional = OpenCC.Converter({ from: "cn", to: "tw" });

export function createSearch(guide: Guide): (query: string) => GuideEvent[] {
  const fuse = new Fuse(guide.events, {
    keys: [
      { name: "title", weight: 2 },
      { name: "options.text", weight: 1 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
  });
  return (query) => {
    const q = query.trim();
    if (!q) return guide.events;
    const found = new Map<string, GuideEvent>();
    for (const term of new Set([q, toTraditional(q)])) {
      for (const r of fuse.search(term)) found.set(r.item.id, r.item);
    }
    return [...found.values()];
  };
}
