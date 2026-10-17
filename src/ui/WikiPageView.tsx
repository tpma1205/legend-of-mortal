import type { Block, Inline, WikiPage } from "../guide/wiki";
import type { WikiIndex } from "../guide/wikiIndex";
import { KIND_LABEL } from "./sections";
import { wikiHref } from "./route";

function Runs({ runs, index }: { runs: Inline[]; index: WikiIndex }) {
  return (
    <>
      {runs.map((r, i) => {
        const target = index.resolve(r.to);
        const body = r.note ? (
          <span className="noted" title={r.note}>
            {r.text}
          </span>
        ) : (
          r.text
        );
        return target ? (
          <a key={i} href={wikiHref(target)}>
            {body}
          </a>
        ) : (
          <span key={i}>{body}</span>
        );
      })}
    </>
  );
}

const HEADER_KINDS = new Set(["book", "skill", "item", "pill"]);

function BlockView({ block, index, header }: { block: Block; index: WikiIndex; header: boolean }) {
  switch (block.type) {
    case "h": {
      const Tag = `h${Math.min(6, Math.max(2, block.level))}` as "h2";
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
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className="wiki-list">
          {block.items.map((it, i) => (
            <li key={i} style={{ marginLeft: `${it.depth * 1.25}rem` }}>
              <Runs runs={it.text} index={index} />
            </li>
          ))}
        </Tag>
      );
    }
    case "table":
      return (
        <div className="table-wrap">
          <table>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => {
                    const Cell = header && r === 0 ? "th" : "td";
                    return (
                      <Cell key={c}>
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

export function WikiPageView({ page, index }: { page: WikiPage; index: WikiIndex }) {
  const origin = `https://smilin.net/LoM-wiki/${page.id.replace(/\/index$/, "/")}${page.id.endsWith("/index") ? "" : ".html"}`;
  return (
    <article className="event wiki-page">
      <header>
        <p className="when">{KIND_LABEL[page.kind]}</p>
        <h1>{page.title}</h1>
      </header>
      {page.blocks.map((b, i) => (
        <BlockView key={i} block={b} index={index} header={HEADER_KINDS.has(page.kind)} />
      ))}
      <p className="meta origin">
        資料版本 {index.source?.version}・
        <a href={origin} target="_blank" rel="noreferrer">
          活俠傳 wiki 原頁
        </a>
      </p>
    </article>
  );
}
