import Fuse from "fuse.js";
import type { WikiPage } from "./wiki";
import { pageText, type WikiIndex } from "./wikiIndex";

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
export async function createWikiSearch(index: WikiIndex): Promise<(query: string) => SearchHit[]> {
  // the conversion dictionary is large, so it is only fetched once someone searches
  const OpenCC = await import("opencc-js/cn2t");
  const toTraditional = OpenCC.Converter({ from: "cn", to: "tw" });
  const docs = index.pages.map((page) => ({ page, title: page.title, tags: page.tags.join(" "), text: pageText(page) }));
  const fuse = new Fuse(docs, {
    keys: [
      { name: "title", weight: 5 },
      { name: "tags", weight: 2 },
      { name: "text", weight: 1 },
    ],
    threshold: 0.25,
    ignoreLocation: true,
    minMatchCharLength: 1,
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

const built = new WeakMap<WikiIndex, Promise<(query: string) => SearchHit[]>>();

/** the search index depends only on the (static) wiki index, so build it once */
export function getWikiSearch(index: WikiIndex): Promise<(query: string) => SearchHit[]> {
  let search = built.get(index);
  if (!search) built.set(index, (search = createWikiSearch(index)));
  return search;
}
