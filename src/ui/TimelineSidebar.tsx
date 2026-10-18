import { useMemo, useState } from "react";
import { MCollapse, MCollapseItem, MInput } from "@shuimo-design/react";
import type { WikiIndex } from "../guide/wikiIndex";
import { buildTimeline, parseEventId } from "../guide/timeline";
import { useOpenGroups } from "./useOpenGroups";
import { wikiHref } from "./route";

const PERIOD = ["", "上", "中", "下"];
const MONTH = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

export function TimelineSidebar({ index, activeId }: { index: WikiIndex; activeId: string }) {
  const [filter, setFilter] = useState("");
  const timeline = useMemo(() => buildTimeline(index.ofKind("event")), [index]);
  const shown = timeline
    .map((y) => ({ ...y, months: y.months.map((m) => ({ ...m, events: m.events.filter((e) => !filter || e.title.includes(filter)) })).filter((m) => m.events.length) }))
    .filter((y) => y.months.length);
  const activeYear = parseEventId(activeId)?.year;
  const names = shown.map((y) => `y${y.year}`);
  const [open, setOpen] = useOpenGroups(activeYear === undefined ? undefined : `y${activeYear}`, filter !== "", names, "y1");

  return (
    <nav className="sidebar" aria-label="事件時間軸">
      <div className="tools">
        <MInput value={filter} onValueChange={setFilter} placeholder="篩選事件名稱" clearable aria-label="篩選事件名稱" />
      </div>
      {shown.length === 0 && <p className="empty">找不到符合的事件。</p>}
      <MCollapse value={open} onValueChange={setOpen}>
        {shown.map((y) => (
          <MCollapseItem key={y.year} name={`y${y.year}`} title={y.year === 0 ? "任意時間" : `第${y.year}年`}>
            {y.months.map((m) => (
              <div key={m.month}>
                {m.month > 0 && <h3 className="month-head">{MONTH[m.month]}月</h3>}
                <ol>
                  {m.events.map((e) => (
                    <li key={e.id}>
                      <a className="dated" href={wikiHref(e.id)} aria-current={e.id === activeId ? "page" : undefined}>
                        <span className="month">{e.period > 0 ? `${PERIOD[e.period]}旬` : ""}</span>
                        <span>{e.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </MCollapseItem>
        ))}
      </MCollapse>
    </nav>
  );
}
