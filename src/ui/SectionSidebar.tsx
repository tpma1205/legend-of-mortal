import { useState } from "react";
import type { WikiPage } from "../guide/wiki";
import type { WikiIndex } from "../guide/wikiIndex";
import { KIND_LABEL, type Section } from "./sections";
import { wikiHref } from "./route";

const collator = new Intl.Collator("zh-Hant", { numeric: true });

export function pagesOfSection(index: WikiIndex, section: Section): WikiPage[] {
  return index.ofKind(...section.kinds).sort((a, b) => section.kinds.indexOf(a.kind) - section.kinds.indexOf(b.kind) || collator.compare(a.id, b.id));
}

interface Group {
  label: string;
  pages: WikiPage[];
}

const NOT_A_FACTION = new Set(["人物", "可攻略女角"]);

/** characters are grouped by their first faction tag; everything else by wiki kind */
export function groupsOf(section: Section, pages: WikiPage[]): Group[] {
  if (section.id === "characters") {
    const byFaction = new Map<string, WikiPage[]>();
    for (const p of pages) {
      const faction = p.tags.find((t) => !NOT_A_FACTION.has(t)) ?? "其他";
      byFaction.set(faction, [...(byFaction.get(faction) ?? []), p]);
    }
    const rank = (label: string) => (label === "唐門" ? -1 : label === "其他" ? 1 : 0);
    return [...byFaction]
      .sort((a, b) => rank(a[0]) - rank(b[0]) || b[1].length - a[1].length || collator.compare(a[0], b[0]))
      .map(([label, list]) => ({ label, pages: list }));
  }
  return section.kinds
    .map((kind) => ({ label: KIND_LABEL[kind], pages: pages.filter((p) => p.kind === kind) }))
    .filter((g) => g.pages.length > 0);
}

export function SectionSidebar({ index, section, activeId }: { index: WikiIndex; section: Section; activeId: string }) {
  const [filter, setFilter] = useState("");
  const all = pagesOfSection(index, section);
  const pages = all.filter((p) => !filter || p.title.includes(filter));
  const groups = groupsOf(section, pages);
  const showHeadings = section.id === "characters" || section.kinds.length > 1;
  return (
    <nav className="sidebar" aria-label={section.label}>
      <div className="tools">
        {all.length > 4 && (
          <input type="search" placeholder={`在${section.label}內篩選`} aria-label={`在${section.label}內篩選`} value={filter} onChange={(e) => setFilter(e.target.value)} />
        )}
      </div>
      {pages.length === 0 && <p className="empty">找不到符合的項目。</p>}
      {groups.map((g) => (
        <section key={g.label}>
          {showHeadings && <h2 className="year">{g.label}</h2>}
          <ol>
            {g.pages.map((p) => (
              <li key={p.id}>
                <a href={wikiHref(p.id)} aria-current={p.id === activeId ? "page" : undefined}>
                  <span>{p.title}</span>
                  {p.tags.includes("可攻略女角") && <span className="badge">可攻略</span>}
                </a>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </nav>
  );
}
