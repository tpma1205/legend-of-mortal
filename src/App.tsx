import { useEffect, useState } from "react";
import { loadWiki } from "./guide/wikiData";
import type { WikiIndex } from "./guide/wikiIndex";
import { TimelineSidebar } from "./ui/TimelineSidebar";
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

  const page = route.page === "wiki" ? index?.byId.get(route.id) : undefined;
  const section = route.page === "section" ? SECTIONS.find((s) => s.id === route.section) : page ? sectionOfKind(page.kind) : undefined;
  const sectionPages = index && route.page === "section" && section ? pagesOfSection(index, section) : [];
  // a section made of one to three pages opens its first page straight away
  const autoOpen = sectionPages.length > 0 && sectionPages.length <= 3 ? sectionPages[0] : undefined;
  const q = route.page === "search" ? route.q : "";

  const side = index
    ? section
      ? <SectionSidebar index={index} section={section} activeId={page?.id ?? autoOpen?.id ?? ""} />
      : route.page !== "search" && <TimelineSidebar index={index} activeId={page?.id ?? ""} />
    : null;
  const nav = activeNav(route, index);

  return (
    <div className={side ? "shell" : "shell no-side"}>
      <header className="top">
        <a className="brand" href="#/">
          活俠傳攻略
        </a>
        <nav className="topnav" aria-label="主要分區">
          <a href="#/" aria-current={nav === "guide" ? "page" : undefined}>
            事件攻略
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
          placeholder="搜尋人物、秘笈、事件、結局…"
          aria-label="全站搜尋"
          value={q}
          onChange={(e) => {
            location.hash = e.target.value ? searchHref(e.target.value) : "#/";
          }}
        />
        <button className="theme" onClick={() => setDark(!dark)} aria-pressed={dark}>
          {dark ? "淺色" : "深色"}
        </button>
      </header>
      {side}
      <main id="main">
        {loadError && <p className="empty">資料載入失敗：{loadError}</p>}
        {!index && !loadError && <p className="empty">載入中…</p>}
        {index && route.page === "wiki" && (page ? <WikiPageView page={page} index={index} /> : <p className="empty">找不到這一頁。</p>)}
        {index && route.page === "section" && section && (autoOpen ? <WikiPageView page={autoOpen} index={index} /> : (
          <div className="home">
            <h1>{section.label}</h1>
            <p>從左側清單選一項查看。共 {sectionPages.length} 項。</p>
          </div>
        ))}
        {index && route.page === "search" && <SearchView index={index} q={route.q} />}
        {index && route.page === "home" && (
          <div className="home">
            <h1>選了這個，會走到哪？</h1>
            <p>從左側時間軸選一個事件，核對遊戲內的選項與後果。想查人物、秘笈、道具或結局，用上方分區或搜尋。</p>
            <p className="meta">
              收錄 {index.ofKind("event").length} 個事件、{index.ofKind("character").length} 位人物、{index.ofKind("book").length} 本秘笈、
              {index.ofKind("ending").length} 個汗青書、{index.ofKind("badend").length} 個生死簿。
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
