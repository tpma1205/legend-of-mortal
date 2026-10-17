import Fuse from "fuse.js";
import * as OpenCC from "opencc-js/cn2t";
import type { WikiPage } from "./wiki";
import { pageText, type WikiIndex } from "./wikiIndex";

const toTraditional = OpenCC.Converter({ from: "cn", to: "tw" });

export interface SearchHit {
  page: WikiPage;
  snippet: string;
}

const snippetOf = (page: WikiPage, q: string): string => {
  const text = pageText(page).replace(/\s+/g, " ");
  const at = text.indexOf(q);
  if (at < 0) return text.slice(0, 80);
  return (at > 20 ? "…" : "") + text.slice(Math.max(0, at - 20), at + 70);
};

/** Fuzzy search over every converted wiki page; simplified input is converted to traditional first. */
export function createWikiSearch(index: WikiIndex): (query: string) => SearchHit[] {
  const docs = index.pages.map((page) => ({ page, title: page.title, tags: page.tags.join(" "), text: pageText(page) }));
  const fuse = new Fuse(docs, {
    keys: [
      { name: "title", weight: 5 },
      { name: "tags", weight: 2 },
      { name: "text", weight: 1 },
    ],
    threshold: 0.25,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
  return (query) => {
    const q = query.trim();
    if (q.length < 1) return [];
    const found = new Map<string, SearchHit>();
    for (const term of new Set([q, toTraditional(q)])) {
      for (const r of fuse.search(term, { limit: 60 })) {
        if (!found.has(r.item.page.id)) found.set(r.item.page.id, { page: r.item.page, snippet: snippetOf(r.item.page, term) });
      }
    }
    return [...found.values()].slice(0, 80);
  };
}
