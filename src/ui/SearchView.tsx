import { useMemo } from "react";
import type { WikiIndex } from "../guide/wikiIndex";
import { createWikiSearch } from "../guide/wikiSearch";
import { KIND_LABEL } from "./sections";
import { wikiHref } from "./route";

export function SearchView({ index, q }: { index: WikiIndex; q: string }) {
  const search = useMemo(() => createWikiSearch(index), [index]);
  const hits = useMemo(() => search(q), [search, q]);
  return (
    <article className="event">
      <header>
        <p className="when">搜尋</p>
        <h1>{q ? `「${q}」` : "請輸入關鍵字"}</h1>
      </header>
      {q && hits.length === 0 && <p className="empty">找不到符合的內容。</p>}
      <ul className="results">
        {hits.map(({ page, snippet }) => (
          <li key={page.id}>
            <a href={wikiHref(page.id)}>
              <span className="kind">{KIND_LABEL[page.kind]}</span>
              <strong>{page.title}</strong>
            </a>
            <p className="meta">{snippet}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
