import { useState } from "react";
import { MBorder, MCollapse, MCollapseItem, MInput } from "@shuimo-design/react";
import type { WikiIndex } from "../guide/wikiIndex";
import { groupsOf, pagesOfSection, type Item } from "./sidebarGroups";
import type { Section } from "./sections";
import { useOpenGroups } from "./useOpenGroups";
import { wikiHref } from "./route";

export function SectionSidebar({ index, section, activeId }: { index: WikiIndex; section: Section; activeId: string }) {
  const [filter, setFilter] = useState("");
  const all = pagesOfSection(index, section);
  const pages = all.filter((p) => !filter || p.title.includes(filter));
  const groups = groupsOf(index, section, pages, filter);
  const headings = section.id === "characters" || section.kinds.length > 1;
  const names = groups.map((g) => g.label);
  const activeGroup = groups.find((g) => g.items.some((i) => i.pageId === activeId))?.label;
  const [open, setOpen] = useOpenGroups(activeGroup, filter !== "" || !headings, names);

  const list = (items: Item[]) => (
    <ol>
      {items.map((it) => (
        <li key={it.key}>
          <a className={it.missing ? "missing" : undefined} href={wikiHref(it.pageId)} aria-current={it.pageId === activeId ? "page" : undefined}>
            <span>{it.label}</span>
            {it.badge && <span className="badge">{it.badge}</span>}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav className="sidebar" aria-label={section.label}>
      {all.length > 4 && (
        <div className="tools">
          <MInput value={filter} onValueChange={setFilter} placeholder={`在${section.label}內篩選`} clearable aria-label={`在${section.label}內篩選`} />
        </div>
      )}
      {groups.every((g) => g.items.length === 0) && <p className="empty">找不到符合的項目。</p>}
      {headings ? (
        <MCollapse value={open} onValueChange={setOpen}>
          {groups.map((g) => (
            <MCollapseItem key={g.label} name={g.label} title={`${g.label}（${g.items.length}）`}>
              {list(g.items)}
            </MCollapseItem>
          ))}
        </MCollapse>
      ) : (
        groups.map((g) => <section key={g.label}>{list(g.items)}</section>)
      )}
      <MBorder right border={false} className="sidebar-edge" seed={3} strokeWidth={3} />
    </nav>
  );
}
