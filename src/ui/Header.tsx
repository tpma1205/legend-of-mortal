import { MBorder, MButton, MDarkMode, MInput, MStamp } from "@shuimo-design/react";
import { SECTIONS } from "./sections";
import { searchHref, sectionHref } from "./route";

export function Header({ nav, q, narrow, menu, onMenu }: { nav: string; q: string; narrow: boolean; menu: boolean; onMenu: () => void }) {
  const items = [{ id: "guide", label: "事件攻略", href: "#/" }, ...SECTIONS.map((s) => ({ id: s.id, label: s.label, href: sectionHref(s.id) }))];
  return (
    <header className="top">
      <a className="brand" href="#/" aria-label="活俠傳攻略 首頁">
        <MStamp text="活俠" size={narrow ? 30 : 40} seed={11} />
        <span>活俠傳攻略</span>
      </a>
      <nav className="topnav" aria-label="主要分區">
        {items.map((it, i) => (
          <a key={it.id} href={it.href} aria-current={nav === it.id ? "page" : undefined}>
            {nav === it.id ? (
              <MBorder tag="span" border={false} bottom strokeWidth={3} seed={i + 1} className="underline">
                {it.label}
              </MBorder>
            ) : (
              it.label
            )}
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
          placeholder={narrow ? "搜尋" : "搜尋人物、秘笈、事件、結局…"}
          clearable
          aria-label="全站搜尋"
        />
        {menu && (
          <MButton type="text" onClick={onMenu} text="目錄" />
        )}
        <MDarkMode autoMode />
      </div>
      <MBorder bottom border={false} className="top-edge" seed={5} strokeWidth={3} />
    </header>
  );
}
