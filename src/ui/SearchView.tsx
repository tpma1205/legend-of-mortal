import { useEffect, useMemo, useState } from "react";
import { MBorder, MEmpty, MLoading, MTag } from "@shuimo-design/react";
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
        <h1>{q ? `搜尋「${q}」` : "請輸入關鍵字"}</h1>
        <MBorder bottom border={false} seed={2} strokeWidth={4} flyingWhite={0.2} className="title-rule" />
      </header>
      {q && !search && <MLoading />}
      {q && search && hits.length === 0 && <MEmpty description="找不到符合的內容。" />}
      <ul className="results">
        {hits.map(({ page, snippet }) => (
          <li key={page.id}>
            <a href={wikiHref(page.id)}>
              <MTag size="sm" className="kind">
                {KIND_LABEL[page.kind]}
              </MTag>
              <strong>{page.title}</strong>
            </a>
            <p className="meta">{snippet}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
