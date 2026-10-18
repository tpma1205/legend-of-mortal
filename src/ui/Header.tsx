import { MBorder, MButton, MDarkMode, MInput, MStamp } from "@shuimo-design/react";
import { SECTIONS } from "./sections";
import { searchHref, sectionHref } from "./route";

export function Header({ nav, q, side, onSide }: { nav: string; q: string; side: "open" | "closed" | "none"; onSide: () => void }) {
  const items = [{ id: "guide", label: "事件攻略", href: "#/" }, ...SECTIONS.map((s) => ({ id: s.id, label: s.label, href: sectionHref(s.id) }))];
  return (
    <header className="top">
      <a className="brand" href="#/" aria-label="活俠傳攻略 首頁">
        <MStamp text="活俠" size={40} seed={11} />
        <span>活俠傳攻略</span>
      </a>
      <nav className="topnav" aria-label="主要分區">
        {items.map((it) => (
          <a key={it.id} href={it.href} aria-current={nav === it.id ? "page" : undefined}>
            {it.label}
          </a>
        ))}
      </nav>
      <div className="top-tools">
        <MInput
          className="global-search"
          value={q}
          onValueChange={(v) => {
            location.hash = v ? searchHref(v) : "#/";
          }}
          placeholder="搜尋人物、秘笈、事件、結局…"
          clearable
          aria-label="全站搜尋"
        />
        {side !== "none" && <MButton type="text" onClick={onSide} text={side === "open" ? "收合側欄" : "展開側欄"} />}
        <MDarkMode autoMode />
      </div>
      <MBorder bottom border={false} className="top-edge" seed={5} strokeWidth={3} />
    </header>
  );
}
