import { useEffect } from "react";
import { guide, isDemo } from "./guide/guide";
import { Sidebar } from "./ui/Sidebar";
import { EventView } from "./ui/EventView";
import { EndingsView } from "./ui/EndingsView";
import { useRoute, useStoredBool } from "./ui/route";

export function App() {
  const route = useRoute();
  const [revealAll, setRevealAll] = useStoredBool("revealAll", false);
  const [dark, setDark] = useStoredBool("dark", matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    document.getElementById("main")?.scrollTo(0, 0);
  }, [route]);

  return (
    <div className="shell">
      <header className="top">
        <a className="brand" href="#/">
          活俠傳攻略
        </a>
        <p className="tag">玩家整理，非官方</p>
        <label className="toggle">
          <input type="checkbox" checked={revealAll} onChange={(e) => setRevealAll(e.target.checked)} />
          顯示全部後果
        </label>
        <button className="theme" onClick={() => setDark(!dark)} aria-pressed={dark}>
          {dark ? "淺色" : "深色"}
        </button>
      </header>
      {isDemo && <p className="demo">開發預覽：data/ 內尚無資料，顯示範例。</p>}
      <Sidebar guide={guide} route={route} />
      <main id="main">
        {route.page === "event" && <EventView guide={guide} id={route.id} revealAll={revealAll} />}
        {route.page === "endings" && <EndingsView guide={guide} focusId={route.id} />}
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
    </div>
  );
}
