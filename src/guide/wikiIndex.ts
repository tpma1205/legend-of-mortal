import type { Block, Inline, WikiDataset, WikiKind, WikiPage } from "./wiki";

export interface WikiIndex {
  pages: WikiPage[];
  byId: Map<string, WikiPage>;
  source: WikiDataset["source"] | undefined;
  ofKind(...kinds: WikiKind[]): WikiPage[];
  /** page id for a link target (`@名稱` or a wiki path), or undefined when no such page was converted */
  resolve(to: string | undefined): string | undefined;
  /** link targets that point at pages we do not have, each listed once */
  unresolved: string[];
  /** page id -> ids of the pages that link to it, each once, in page order, never itself */
  backlinks: Map<string, string[]>;
}

export class WikiIndexError extends Error {}

/** when several pages share a title, `@name` links go to the first kind in this list */
const NAME_PRIORITY: WikiKind[] = ["character", "book", "pursuit", "ending", "badend", "achievement", "item", "pill", "skill", "event", "other"];

export function inlinesOf(block: Block): Inline[] {
  switch (block.type) {
    case "h":
    case "p":
      return block.text;
    case "list":
      return block.items.flatMap((i) => i.text);
    case "table":
      return block.rows.flatMap((r) => r.flatMap((c) => c.flat()));
  }
}

export function buildWikiIndex(datasets: WikiDataset[]): WikiIndex {
  const pages = datasets.flatMap((d) => d.pages);
  const byId = new Map<string, WikiPage>();
  for (const page of pages) {
    if (byId.has(page.id)) throw new WikiIndexError(`duplicate page id: ${page.id}`);
    byId.set(page.id, page);
  }

  const byName = new Map<string, WikiPage>();
  for (const kind of [...NAME_PRIORITY].reverse()) {
    for (const page of pages) if (page.kind === kind && page.title) byName.set(page.title, page);
  }

  const resolve = (to: string | undefined): string | undefined => {
    if (!to) return undefined;
    if (to.startsWith("@")) return byName.get(to.slice(1))?.id;
    const path = to.replace(/\/$/, "");
    if (byId.has(path)) return path;
    return byId.has(`${path}/index`) ? `${path}/index` : undefined;
  };

  const unresolved = new Set<string>();
  const backlinks = new Map<string, string[]>();
  for (const page of pages) {
    for (const block of page.blocks) {
      for (const run of inlinesOf(block)) {
        if (!run.to) continue;
        const target = resolve(run.to);
        if (!target) unresolved.add(run.to);
        else if (target !== page.id) {
          const from = backlinks.get(target) ?? [];
          if (!from.includes(page.id)) backlinks.set(target, [...from, page.id]);
        }
      }
    }
  }

  return {
    pages,
    byId,
    source: datasets[0]?.source,
    ofKind: (...kinds) => pages.filter((p) => kinds.includes(p.kind)),
    resolve,
    unresolved: [...unresolved].sort(),
    backlinks,
  };
}

/** plain text of a page, for search */
export function pageText(page: WikiPage): string {
  return page.blocks.map((b) => inlinesOf(b).map((r) => r.text).join(" ")).join("\n");
}
