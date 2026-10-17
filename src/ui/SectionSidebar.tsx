import { useState } from "react";
import type { WikiPage } from "../guide/wiki";
import type { WikiIndex } from "../guide/wikiIndex";
import { KIND_LABEL, type Section } from "./sections";
import { wikiHref } from "./route";

const collator = new Intl.Collator("zh-Hant", { numeric: true });

export function pagesOfSection(index: WikiIndex, section: Section): WikiPage[] {
  return index.ofKind(...section.kinds).sort((a, b) => section.kinds.indexOf(a.kind) - section.kinds.indexOf(b.kind) || collator.compare(a.id, b.id));
}

export function SectionSidebar({ index, section, activeId }: { index: WikiIndex; section: Section; activeId: string }) {
  const [filter, setFilter] = useState("");
  const all = pagesOfSection(index, section);
  const pages = all.filter((p) => !filter || p.title.includes(filter));
  const grouped = section.kinds.length > 1;
  return (
    <nav className="sidebar" aria-label={section.label}>
      <div className="tools">
        {all.length > 4 && (
          <input type="search" placeholder={`在${section.label}內篩選`} aria-label={`在${section.label}內篩選`} value={filter} onChange={(e) => setFilter(e.target.value)} />
        )}
      </div>
      {pages.length === 0 && <p className="empty">找不到符合的項目。</p>}
      {section.kinds.map((kind) => {
        const list = pages.filter((p) => p.kind === kind);
        if (list.length === 0) return null;
        return (
          <section key={kind}>
            {grouped && <h2 className="year">{KIND_LABEL[kind]}</h2>}
            <ol>
              {list.map((p) => (
                <li key={p.id}>
                  <a href={wikiHref(p.id)} aria-current={p.id === activeId ? "page" : undefined}>
                    <span>{p.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </nav>
  );
}
