import { useState } from "react";
import type { WikiPage } from "../guide/wiki";
import type { WikiIndex } from "../guide/wikiIndex";
import { endingEntries } from "../guide/endingList";
import { KIND_LABEL, type Section } from "./sections";
import { wikiHref } from "./route";

const collator = new Intl.Collator("zh-Hant", { numeric: true });

export function pagesOfSection(index: WikiIndex, section: Section): WikiPage[] {
  return index.ofKind(...section.kinds).sort((a, b) => section.kinds.indexOf(a.kind) - section.kinds.indexOf(b.kind) || collator.compare(a.id, b.id));
}

interface Item {
  key: string;
  label: string;
  /** page this item opens */
  pageId: string;
  /** true when the wiki lists the entry but has no detail page yet */
  missing?: boolean;
  badge?: string;
}

interface Group {
  label: string;
  items: Item[];
}

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

export function SectionSidebar({ index, section, activeId }: { index: WikiIndex; section: Section; activeId: string }) {
  const [filter, setFilter] = useState("");
  const all = pagesOfSection(index, section);
  const pages = all.filter((p) => !filter || p.title.includes(filter));
  const groups = groupsOf(index, section, pages, filter);
  const showHeadings = section.id === "characters" || section.kinds.length > 1;
  const empty = groups.every((g) => g.items.length === 0);
  return (
    <nav className="sidebar" aria-label={section.label}>
      <div className="tools">
        {all.length > 4 && (
          <input type="search" placeholder={`在${section.label}內篩選`} aria-label={`在${section.label}內篩選`} value={filter} onChange={(e) => setFilter(e.target.value)} />
        )}
      </div>
      {empty && <p className="empty">找不到符合的項目。</p>}
      {groups.map((g) => (
        <section key={g.label}>
          {showHeadings && g.items.length > 0 && <h2 className="year">{g.label}</h2>}
          <ol>
            {g.items.map((it) => (
              <li key={it.key}>
                <a
                  className={it.missing ? "missing" : undefined}
                  href={wikiHref(it.pageId)}
                  aria-current={it.pageId === activeId ? "page" : undefined}
                >
                  <span>{it.label}</span>
                  {it.badge && <span className="badge">{it.badge}</span>}
                </a>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </nav>
  );
}
