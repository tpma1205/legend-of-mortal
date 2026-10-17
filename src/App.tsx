import { useEffect, useState } from "react";
import { guide, isDemo } from "./guide/guide";
import { loadWiki } from "./guide/wikiData";
import type { WikiIndex } from "./guide/wikiIndex";
import { Sidebar } from "./ui/Sidebar";
import { EventView } from "./ui/EventView";
import { EndingsView } from "./ui/EndingsView";
import { SectionSidebar, pagesOfSection } from "./ui/SectionSidebar";
import { SearchView } from "./ui/SearchView";
import { WikiPageView } from "./ui/WikiPageView";
import { SECTIONS, sectionOfKind } from "./ui/sections";
import { searchHref, sectionHref, useRoute, useStoredBool, type Route } from "./ui/route";

function activeNav(route: Route, index: WikiIndex | null): string {
  if (route.page === "section") return route.section;
  if (route.page === "wiki") {
    const kind = index?.byId.get(route.id)?.kind;
    return (kind && sectionOfKind(kind)?.id) || "guide";
  }
  if (route.page === "search") return "";
  return "guide";
}

export function App() {
  const route = useRoute();
  const [index, setIndex] = useState<WikiIndex | null>(null);
  const [loadError, setLoadError] = useState("");
  const [revealAll, setRevealAll] = useStoredBool("revealAll", false);
  const [dark, setDark] = useStoredBool("dark", matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    loadWiki().then(setIndex, (e) => setLoadError(String(e)));
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    document.getElementById("main")?.scrollTo(0, 0);
  }, [route]);

  const nav = activeNav(route, index);
  const needsWiki = route.page === "wiki" || route.page === "section" || route.page === "search";
  const page = route.page === "wiki" ? index?.byId.get(route.id) : undefined;
  const section = route.page === "section" ? SECTIONS.find((s) => s.id === route.section) : page ? sectionOfKind(page.kind) : undefined;
  const wikiSide = index && section;
  const timelineSide = !needsWiki || (route.page === "wiki" && !section);
  const q = route.page === "search" ? route.q : "";

  // sections made of one or two pages open straight away
  const sectionPages = index && route.page === "section" && section ? pagesOfSection(index, section) : [];
  const autoOpen = sectionPages.length > 0 && sectionPages.length <= 3 ? sectionPages[0] : undefined;

  return (
    <div className={wikiSide || timelineSide ? "shell" : "shell no-side"}>
      <header className="top">
        <a className="brand" href="#/">
          活俠傳攻略
        </a>
        <nav className="topnav" aria-label="主要分區">
          <a href="#/" aria-current={nav === "guide" ? "page" : undefined}>
            攻略
          </a>
          {SECTIONS.map((s) => (
            <a key={s.id} href={sectionHref(s.id)} aria-current={nav === s.id ? "page" : undefined}>
              {s.label}
            </a>
          ))}
        </nav>
        <input
          className="global-search"
          type="search"
          placeholder="搜尋人物、秘笈、結局…"
          aria-label="全站搜尋"
          value={q}
          onChange={(e) => {
            location.hash = e.target.value ? searchHref(e.target.value) : "#/";
          }}
        />
        <label className="toggle">
          <input type="checkbox" checked={revealAll} onChange={(e) => setRevealAll(e.target.checked)} />
          顯示全部後果
        </label>
        <button className="theme" onClick={() => setDark(!dark)} aria-pressed={dark}>
          {dark ? "淺色" : "深色"}
        </button>
      </header>
      {isDemo && <p className="demo">開發預覽：data/ 內尚無資料，顯示範例。</p>}
      {wikiSide && <SectionSidebar index={index} section={section} activeId={page?.id ?? autoOpen?.id ?? ""} />}
      {timelineSide && <Sidebar guide={guide} route={route} />}
      <main id="main">
        {loadError && <p className="empty">資料載入失敗：{loadError}</p>}
        {needsWiki && !index && !loadError && <p className="empty">載入中…</p>}
        {route.page === "event" && <EventView guide={guide} id={route.id} revealAll={revealAll} />}
        {route.page === "endings" && <EndingsView guide={guide} focusId={route.id} />}
        {index && route.page === "wiki" && (page ? <WikiPageView page={page} index={index} /> : <p className="empty">找不到這一頁。</p>)}
        {index && route.page === "section" && section && (autoOpen ? <WikiPageView page={autoOpen} index={index} /> : (
          <div className="home">
            <h1>{section.label}</h1>
            <p>從左側清單選一項查看。共 {sectionPages.length} 項。</p>
          </div>
        ))}
        {index && route.page === "search" && <SearchView index={index} q={route.q} />}
        {route.page === "home" && (
          <div className="home">
            <h1>選了這個，會走到哪？</h1>
            <p>從左側時間軸選一個事件，核對遊戲內的選項。後果預設收合，避免劇透。</p>
            <p className="meta">
              收錄 {guide.events.length} 個事件、{guide.endings.length} 個結局。
            </p>
          </div>
        )}
      </main>
      <footer className="foot">
        資料整理自
        <a href="https://smilin.net/LoM-wiki/" target="_blank" rel="noreferrer">
          活俠傳 wiki
        </a>
        （{index?.source?.version ?? "v1.0.3130"}），依 CC BY-NC-SA 4.0 授權；本站非官方、非商業，不使用遊戲圖片。
      </footer>
    </div>
  );
}
