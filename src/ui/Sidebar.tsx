import { useMemo, useState } from "react";
import type { Guide } from "../guide/loadGuide";
import { createSearch } from "../guide/search";
import { eventHref, endingHref, type Route } from "./route";

export function Sidebar({ guide, route }: { guide: Guide; route: Route }) {
  const [query, setQuery] = useState("");
  const [routeId, setRouteId] = useState("");
  const search = useMemo(() => createSearch(guide), [guide]);

  const events = search(query).filter((e) => !routeId || e.routeIds.includes(routeId));
  const sorted = [...events].sort((a, b) => a.year - b.year || a.month - b.month);
  const years = [...new Set(sorted.map((e) => e.year))];
  const activeId = route.page === "event" ? route.id : "";

  return (
    <nav className="sidebar" aria-label="事件時間軸">
      <div className="tools">
        <input
          type="search"
          placeholder="搜尋事件或選項"
          aria-label="搜尋事件或選項"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select aria-label="依路線篩選" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
          <option value="">全部路線</option>
          {guide.routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <a className={route.page === "endings" ? "endings-link current" : "endings-link"} href={endingHref()}>
          結局一覽
        </a>
      </div>
      {sorted.length === 0 && <p className="empty">找不到符合的事件。</p>}
      {years.map((y) => (
        <section key={y}>
          <h2 className="year">第{y}年</h2>
          <ol>
            {sorted
              .filter((e) => e.year === y)
              .map((e) => (
                <li key={e.id}>
                  <a href={eventHref(e.id)} aria-current={e.id === activeId ? "page" : undefined}>
                    <span className="month">{e.month}月</span>
                    <span>{e.title}</span>
                  </a>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </nav>
  );
}
