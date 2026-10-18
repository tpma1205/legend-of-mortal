import { useEffect, useState, type ReactNode } from "react";
import { MBackTop, MConfigProvider, MEmpty, MLoading, MReadingStroke, MRicePaper, MSealColophon, MStamp } from "@shuimo-design/react";
import { loadWiki } from "./guide/wikiData";
import type { WikiIndex } from "./guide/wikiIndex";
import { entryForPageId } from "./guide/endingList";
import { Header } from "./ui/Header";
import { TimelineSidebar } from "./ui/TimelineSidebar";
import { SectionSidebar } from "./ui/SectionSidebar";
import { pagesOfSection } from "./ui/sidebarGroups";
import { SearchView } from "./ui/SearchView";
import { PlaceholderView } from "./ui/PlaceholderView";
import { WikiPageView } from "./ui/WikiPageView";
import { SECTIONS, sectionOfKind } from "./ui/sections";
import { sectionHref, useRoute, useStoredBool, type Route } from "./ui/route";

function activeNav(route: Route, index: WikiIndex | null): string {
  if (route.page === "section") return route.section;
  if (route.page === "wiki") {
    const kind = index?.byId.get(route.id)?.kind;
    if (!kind && /^event\/(ends\/end|badends\/badend)-\d+$/.test(route.id)) return "endings";
    return (kind && sectionOfKind(kind)?.id) || "guide";
  }
  if (route.page === "search") return "";
  return "guide";
}

const SECTION_BLURB: Record<string, string> = {
  characters: "按門派分組的人物介紹",
  books: "秘笈需求、各等級效果與技能表",
  items: "道具、裝備與煉丹",
  endings: "汗青書、生死簿與風雲史",
  pursuit: "夢境心上人的結緣步驟",
  mechanism: "行動點、能力值、心相、變心夢、對戰與隱藏參數",
  lore: "開幕前史與五段江湖舊事",
};

function Home({ index }: { index: WikiIndex }) {
  return (
    <div className="home">
      <MStamp text="活俠" size={64} seed={21} />
      <h1>選了這個，會走到哪？</h1>
      <p>從左側時間軸選一個事件，核對遊戲內的選項與後果；想查人物、秘笈、道具或結局，用上方分區或搜尋。</p>
      <p className="meta">
        收錄 {index.ofKind("event").length} 個事件、{index.ofKind("character").length} 位人物、{index.ofKind("book").length} 本秘笈、 54 個汗青書、105 個生死簿。
      </p>
      <ul className="entries">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={sectionHref(s.id)}>{s.label}</a>
            <span>{SECTION_BLURB[s.id]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function App() {
  const route = useRoute();
  const [index, setIndex] = useState<WikiIndex | null>(null);
  const [loadError, setLoadError] = useState("");
  const [sideOpen, setSideOpen] = useStoredBool("sideOpen", true);

  useEffect(() => {
    loadWiki().then(setIndex, (e) => setLoadError(String(e)));
  }, []);
  useEffect(() => {
    document.getElementById("main")?.scrollTo(0, 0);
  }, [route]);

  const page = route.page === "wiki" ? index?.byId.get(route.id) : undefined;
  // 汗青書 / 生死簿 numbers the wiki lists but has not written up still get their own page
  const placeholder = (() => {
    if (!index || route.page !== "wiki" || page) return undefined;
    for (const [kind, dir, prefix, noun] of [["ending", "event/ends", "end-", "汗青書"], ["badend", "event/badends", "badend-", "生死簿"]] as const) {
      const entry = entryForPageId(route.id, index.byId.get(`${dir}/index`), index.ofKind(kind), prefix, noun);
      if (entry) return { entry, noun, overviewId: `${dir}/index`, sectionId: "endings" };
    }
    return undefined;
  })();
  const section =
    route.page === "section"
      ? SECTIONS.find((s) => s.id === route.section)
      : page
        ? sectionOfKind(page.kind)
        : placeholder
          ? SECTIONS.find((s) => s.id === placeholder.sectionId)
          : undefined;
  const sectionPages = index && route.page === "section" && section ? pagesOfSection(index, section) : [];
  // a section made of one to three pages opens its first page straight away
  const autoOpen = sectionPages.length > 0 && sectionPages.length <= 3 ? sectionPages[0] : undefined;
  const q = route.page === "search" ? route.q : "";

  const side: ReactNode = index
    ? section
      ? <SectionSidebar index={index} section={section} activeId={page?.id ?? (placeholder ? placeholder.entry.pageId : autoOpen?.id) ?? ""} />
      : route.page !== "search" && <TimelineSidebar index={index} activeId={page?.id ?? ""} />
    : null;
  const nav = activeNav(route, index);

  return (
    <MConfigProvider>
      <MReadingStroke target="#main" thickness={3} />
      <MRicePaper layout="full-screen" landscape={route.page === "home"} seed={7} className="paper">
        <div className={side ? (sideOpen ? "shell" : "shell side-closed") : "shell no-side"}>
          <Header nav={nav} q={q} side={side ? (sideOpen ? "open" : "closed") : "none"} onSide={() => setSideOpen(!sideOpen)} />
          {side && sideOpen && <aside className="side">{side}</aside>}
          <main id="main">
            {loadError && <MEmpty description={`資料載入失敗：${loadError}`} />}
            {!index && !loadError && <MLoading />}
            {index && route.page === "wiki" && (page ? <WikiPageView page={page} index={index} /> : placeholder ? <PlaceholderView {...placeholder} /> : <MEmpty description="找不到這一頁。" />)}
            {index && route.page === "section" && section && (autoOpen ? <WikiPageView page={autoOpen} index={index} /> : (
              <div className="home">
                <h1>{section.label}</h1>
                <p>從左側清單選一項查看。共 {sectionPages.length} 項。</p>
              </div>
            ))}
            {index && route.page === "search" && <SearchView index={index} q={route.q} />}
            {index && route.page === "home" && <Home index={index} />}
          </main>
          <footer className="foot">
            <MSealColophon text="資料整理自" author="活俠傳 wiki" date={index?.source?.date} seal="活俠" align="right" sealSize={36} seed={5} />
            <p>
              <a href="https://smilin.net/LoM-wiki/" target="_blank" rel="noreferrer">
                smilin.net/LoM-wiki
              </a>
              （{index?.source?.version ?? "v1.0.3130"}），依 CC BY-NC-SA 4.0 授權；本站非官方、非商業；人物立繪為遊戲美術 © Paras Games，直接引用自 wiki，未複製存放於本站。
            </p>
          </footer>
        </div>
      </MRicePaper>
      <MBackTop target="#main" />
    </MConfigProvider>
  );
}
