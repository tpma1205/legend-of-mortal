import { useEffect, useMemo, useState } from "react";
import type { WikiIndex } from "../guide/wikiIndex";
import { getWikiSearch, type SearchHit } from "../guide/wikiSearch";
import { KIND_LABEL } from "./sections";
import { wikiHref } from "./route";

export function SearchView({ index, q }: { index: WikiIndex; q: string }) {
  const [search, setSearch] = useState<((query: string) => SearchHit[]) | null>(null);
  useEffect(() => {
    getWikiSearch(index).then((fn) => setSearch(() => fn));
  }, [index]);
  const hits = useMemo(() => (search ? search(q) : []), [search, q]);
  return (
    <article className="event">
      <header>
        <p className="when">搜尋</p>
        <h1>{q ? `「${q}」` : "請輸入關鍵字"}</h1>
      </header>
      {q && !search && <p className="empty">搜尋準備中…</p>}
      {q && search && hits.length === 0 && <p className="empty">找不到符合的內容。</p>}
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
