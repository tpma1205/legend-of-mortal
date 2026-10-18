import { useState, type ReactNode } from "react";
import { MBreadcrumb, MBreadcrumbItem, MBorder, MCard, MStamp } from "@shuimo-design/react";
import type { Block, Inline, WikiPage } from "../guide/wiki";
import type { WikiIndex } from "../guide/wikiIndex";
import { parseEventId } from "../guide/timeline";
import { KIND_LABEL, sectionOfKind } from "./sections";
import { sectionHref, wikiHref } from "./route";
import { splitGlyphs } from "./glyphs";
import { looksLikeHeader } from "./tableHeader";
import { columnMinWidths, visibleColumns } from "./tableColumns";

/** emoji in the wiki text are drawn in ink instead of full colour */
function Text({ text }: { text: string }) {
  return (
    <>
      {splitGlyphs(text).map((g, i) =>
        g.glyph ? (
          <span key={i} className="glyph" aria-hidden="true">
            {g.text}
          </span>
        ) : (
          g.text
        ),
      )}
    </>
  );
}

/** a hover note that also opens on tap or Enter, so it works on phones and by keyboard */
function Noted({ text, note }: { text: string; note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="noted" title={note} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Text text={text} />
      </button>
      {open && <span className="note-text">（{note}）</span>}
    </>
  );
}

/** a run struck through or hidden in the wiki keeps that look; a hidden run opens on hover, focus or tap */
function Styled({ run, children }: { run: Inline; children: ReactNode }) {
  let out = children;
  if (run.strike) out = <s>{out}</s>;
  if (run.spoiler) {
    out = (
      <span className="spoiler" tabIndex={0} title="點一下或移上去看">
        {out}
      </span>
    );
  }
  return <>{out}</>;
}

function Runs({ runs, index }: { runs: Inline[]; index: WikiIndex }) {
  return (
    <>
      {runs.map((r, i) => {
        const target = index.resolve(r.to);
        let body: ReactNode;
        if (r.href) {
          body = (
            <a href={r.href} target="_blank" rel="noreferrer">
              <Text text={r.text} />
            </a>
          );
        } else if (target) {
          body = (
            <a href={wikiHref(target)}>
              {r.note ? (
                <span className="noted-link" title={r.note}>
                  <Text text={r.text} />
                </span>
              ) : (
                <Text text={r.text} />
              )}
            </a>
          );
        } else body = r.note ? <Noted text={r.text} note={r.note} /> : <Text text={r.text} />;
        return (
          <Styled key={i} run={r}>
            {body}
          </Styled>
        );
      })}
    </>
  );
}

const HEADER_KINDS = new Set(["book", "skill", "item", "pill", "forge", "achievement"]);
const plain = (runs: Inline[]) => runs.map((r) => r.text).join("");

function BlockView({ block, index, header, guessHeader, n }: { block: Block; index: WikiIndex; header: boolean; guessHeader: boolean; n: number }) {
  const kindAllowsGuess = guessHeader;
  switch (block.type) {
    case "h": {
      if (block.level <= 2) return <h2 className="wiki-h2" data-n={n}>{plain(block.text)}</h2>;
      const Tag = `h${Math.min(6, block.level)}` as "h3";
      return (
        <Tag>
          <Runs runs={block.text} index={index} />
        </Tag>
      );
    }
    case "p":
      return (
        <p>
          <Runs runs={block.text} index={index} />
        </p>
      );
    case "list": {
      // the wiki mixes numbered steps and bullets in one list, so each item carries its own marker
      return (
        <ul className="wiki-list">
          {block.items.map((it, i) => (
            <li key={i} className={it.no ? "num" : "bul"} data-no={it.no} style={{ marginLeft: `${it.depth * 1.25}rem` }}>
              <Runs runs={it.text} index={index} />
            </li>
          ))}
        </ul>
      );
    }
    case "hr":
      return <hr className="wiki-hr" />;
    case "code":
      return <pre className="wiki-code">{block.text}</pre>;
    case "table": {
      const asHeader = header || (kindAllowsGuess && looksLikeHeader(block.rows));
      // a header-led table drops columns that are empty throughout; the browser then sizes the rest by their content
      const cols = asHeader ? visibleColumns(block.rows, true) : Array.from({ length: Math.max(...block.rows.map((r) => r.length)) }, (_, i) => i);
      const mins = columnMinWidths(block.rows, cols);
      return (
        <div className="table-wrap">
          <table>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {cols.map((c, i) => {
                    const cell = row[c] ?? [];
                    const Cell = asHeader && r === 0 ? "th" : "td";
                    return (
                      <Cell key={c} style={r === 0 ? { minWidth: `${mins[i]}rem` } : undefined}>
                        {cell.map((line, l) => (
                          <div key={l}>
                            <Runs runs={line} index={index} />
                          </div>
                        ))}
                      </Cell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }
}

function Backlinks({ page, index }: { page: WikiPage; index: WikiIndex }) {
  const from = (index.backlinks.get(page.id) ?? []).map((id) => index.byId.get(id)!).filter(Boolean);
  if (from.length === 0) return null;
  const kinds = [...new Set(from.map((p) => p.kind))];
  return (
    <section className="backlinks">
      <h2 className="wiki-h2">相關頁面</h2>
      {kinds.map((kind) => (
        <p key={kind} className="meta">
          {KIND_LABEL[kind]}：
          {from
            .filter((p) => p.kind === kind)
            .slice(0, 40)
            .map((p, i) => (
              <span key={p.id}>
                {i > 0 && "、"}
                <a href={wikiHref(p.id)}>{p.title}</a>
              </span>
            ))}
        </p>
      ))}
    </section>
  );
}

const MONTH_TEXT = (t: { year: number; month: number }) => (t.year === 0 ? "任意時間" : `第${t.year}年${t.month > 0 ? ` ${t.month}月` : ""}`);

const WIKI_ORIGIN = "https://smilin.net/LoM-wiki";

/**
 * A character's portrait, loaded straight from the wiki's server (nothing is copied into this site) and only on
 * that character's own page. A character the wiki has no art for gets a seal carrying the name instead.
 */
function Portrait({ page }: { page: WikiPage }) {
  const [failed, setFailed] = useState(false);
  const src = page.image && !failed ? `${WIKI_ORIGIN}${page.image}` : undefined;
  return (
    <figure className="portrait">
      {src ? (
        <img src={src} alt={`${page.title}立繪`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        <div className="portrait-seal">
          <MStamp text={page.title} size={112} seed={page.title.length * 7 + 3} />
        </div>
      )}
      <figcaption>{src ? "立繪：遊戲美術 © Paras Games，圖片取自活俠傳 wiki" : "wiki 尚無此人物的立繪"}</figcaption>
    </figure>
  );
}

/** where this page sits: section, then year/month or kind, then the page itself */
export function Crumbs({ page }: { page: WikiPage }) {
  const time = parseEventId(page.id);
  const section = sectionOfKind(page.kind);
  const first = time ? { content: "事件攻略", href: "#/" } : section ? { content: section.label, href: sectionHref(section.id) } : { content: "首頁", href: "#/" };
  const middle = time ? MONTH_TEXT(time) : section && section.kinds.length > 1 ? KIND_LABEL[page.kind] : undefined;
  return (
    <MBreadcrumb className="crumbs">
      <MBreadcrumbItem href={first.href}>{first.content}</MBreadcrumbItem>
      {middle && <MBreadcrumbItem>{middle}</MBreadcrumbItem>}
      <MBreadcrumbItem>{page.title}</MBreadcrumbItem>
    </MBreadcrumb>
  );
}

export function WikiPageView({ page, index }: { page: WikiPage; index: WikiIndex }) {
  const origin = `https://smilin.net/LoM-wiki/${page.id.replace(/\/index$/, "/")}${page.id.endsWith("/index") ? "" : ".html"}`;
  return (
    <article className="event wiki-page">
      <Crumbs page={page} />
      <header>
        <h1>{page.title}</h1>
        <MBorder bottom border={false} seed={2} strokeWidth={4} flyingWhite={0.2} className="title-rule" />
      </header>
      {page.kind === "character" && !page.id.endsWith("/index") && <Portrait page={page} />}
      {page.blocks.map((b, i) => (
        <BlockView key={i} block={b} index={index} header={HEADER_KINDS.has(page.kind)} guessHeader={page.kind !== "character"} n={i} />
      ))}
      <Backlinks page={page} index={index} />
      {page.edits && (
        <MCard title="本站修改" frame="plain" shadow="never" className="edits" seed={4}>
          <ul className="plain">
            {page.edits.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="meta">此頁依 CC BY-NC-SA 4.0 衍生自活俠傳 wiki 原頁，上述為與原頁不同之處。</p>
        </MCard>
      )}
      <p className="meta origin">
        資料版本 {index.source?.version}・
        <a href={origin} target="_blank" rel="noreferrer">
          活俠傳 wiki 原頁
        </a>
      </p>
    </article>
  );
}
