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

function Backlinks({ page, index }: { page: WikiPage; index: WikiIndex }) {
  const from = (index.backlinks.get(page.id) ?? []).map((id) => index.byId.get(id)!).filter(Boolean);
  if (from.length === 0) return null;
  const kinds = [...new Set(from.map((p) => p.kind))];
  return (
    <section className="backlinks">
      <h2>相關頁面</h2>
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
      <Backlinks page={page} index={index} />
      {page.edits && (
        <section className="edits">
          <h2>本站修改</h2>
          <ul className="plain">
            {page.edits.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="meta">此頁依 CC BY-NC-SA 4.0 衍生自活俠傳 wiki 原頁，上述為與原頁不同之處。</p>
        </section>
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
