import type { EndingEntry } from "../guide/endingList";
import { wikiHref } from "./route";

/** one wording for every entry the wiki lists but has not written up */
export const NO_DETAIL = "目前尚無詳細資料：wiki 尚未收錄，或目前版本尚無法達成。";

export function PlaceholderView({ entry, noun, overviewId }: { entry: EndingEntry; noun: string; overviewId: string }) {
  return (
    <article className="event wiki-page">
      <header>
        <p className="when">{noun}</p>
        <h1>{entry.label}</h1>
      </header>
      <p>{NO_DETAIL}</p>
      <p className="meta">
        <a href={wikiHref(overviewId)}>{noun}總表</a>
      </p>
    </article>
  );
}
