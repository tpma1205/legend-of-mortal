import type { WikiPage } from "../guide/wiki";
import type { WikiIndex } from "../guide/wikiIndex";
import { endingEntries } from "../guide/endingList";
import { KIND_LABEL, type Section } from "./sections";

const collator = new Intl.Collator("zh-Hant", { numeric: true });

export function pagesOfSection(index: WikiIndex, section: Section): WikiPage[] {
  return index.ofKind(...section.kinds).sort((a, b) => section.kinds.indexOf(a.kind) - section.kinds.indexOf(b.kind) || collator.compare(a.id, b.id));
}

export interface Item {
  key: string;
  label: string;
  /** page this item opens */
  pageId: string;
  /** true when the wiki lists the entry but has no detail page yet */
  missing?: boolean;
  badge?: string;
}

export interface Group {
  label: string;
  items: Item[];
}

/** a section's overview page: pinned above the groups instead of listed in one */
export const OVERVIEW_OF: Record<string, { id: string; label: string }> = { characters: { id: "people/characters/index", label: "人物列表" } };

const NOT_A_FACTION = new Set(["人物", "可攻略女角"]);

const pageItem = (p: WikiPage): Item => ({ key: p.id, label: p.title, pageId: p.id, badge: p.tags.includes("可攻略女角") ? "可攻略" : undefined });

/** the full numbered list for 汗青書 / 生死簿, taken from the wiki's own index table */
function numbered(index: WikiIndex, kind: "ending" | "badend"): Group {
  const noun = kind === "ending" ? "汗青書" : "生死簿";
  const dir = kind === "ending" ? "event/ends" : "event/badends";
  const overview = index.byId.get(`${dir}/index`);
  const entries = endingEntries(overview, index.ofKind(kind), kind === "ending" ? "end-" : "badend-", noun);
  const items: Item[] = entries.map((e) => ({ key: `${kind}-${e.no}`, label: e.label, pageId: e.pageId, missing: e.missing }));
  if (overview) items.unshift({ key: overview.id, label: `${noun}總表`, pageId: overview.id });
  return { label: noun, items };
}

/** characters are grouped by their first faction tag; endings are numbered from the wiki's index; the rest by wiki kind */
export function groupsOf(index: WikiIndex, section: Section, pages: WikiPage[], filter: string): Group[] {
  if (section.id === "characters") {
    const byFaction = new Map<string, WikiPage[]>();
    for (const p of pages) {
      if (p.id === OVERVIEW_OF.characters.id) continue;
      const faction = p.tags.find((t) => !NOT_A_FACTION.has(t)) ?? "其他";
      byFaction.set(faction, [...(byFaction.get(faction) ?? []), p]);
    }
    const rank = (label: string) => (label === "唐門" ? -1 : label === "其他" ? 1 : 0);
    return [...byFaction]
      .sort((a, b) => rank(a[0]) - rank(b[0]) || b[1].length - a[1].length || collator.compare(a[0], b[0]))
      .map(([label, list]) => ({ label, items: list.map(pageItem) }));
  }
  if (section.id === "endings") {
    const groups = [numbered(index, "ending"), numbered(index, "badend"), { label: KIND_LABEL.achievement, items: index.ofKind("achievement").map(pageItem) }];
    return groups.map((g) => ({ ...g, items: g.items.filter((i) => i.label.includes(filter)) })).filter((g) => g.items.length > 0);
  }
  return section.kinds
    .map((kind) => ({ label: KIND_LABEL[kind], items: pages.filter((p) => p.kind === kind).map(pageItem) }))
    .filter((g) => g.items.length > 0);
}
