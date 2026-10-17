import type { Inline, WikiPage } from "./wiki";

export interface EndingEntry {
  no: number;
  /** e.g. 「汗青書25：退隱江湖」 */
  label: string;
  /** this entry's own page id; the wiki has content for it unless `missing` */
  pageId: string;
  /** true when the wiki lists this number but has not written its detail page yet */
  missing: boolean;
}

const plain = (cell: Inline[][]) => cell.map((line) => line.map((r) => r.text).join("")).join("");

/**
 * The wiki's own index table lists every 汗青書 / 生死簿 number, but only some have a detail page.
 * Build the complete numbered list from that table so the gaps are the wiki's, not ours.
 */
export function endingEntries(index: WikiPage | undefined, pages: WikiPage[], idPrefix: string, noun: string): EndingEntry[] {
  if (!index) return [];
  const have = new Map(pages.map((p) => [p.id, p]));
  const dir = index.id.replace(/\/index$/, "");
  const seen = new Set<number>();
  const entries: EndingEntry[] = [];
  for (const block of index.blocks) {
    if (block.type !== "table") continue;
    for (const row of block.rows.slice(1)) {
      const no = Number(plain(row[0] ?? []).match(/\d+/)?.[0]);
      if (!Number.isFinite(no) || seen.has(no)) continue;
      seen.add(no);
      const name = plain(row[1] ?? []).trim();
      const pageId = `${dir}/${idPrefix}${no}`;
      const exists = have.has(pageId);
      entries.push({ no, label: `${noun}${no}${name ? `：${name}` : ""}`, pageId, missing: !exists });
    }
  }
  return entries.sort((a, b) => a.no - b.no);
}

/** the entry behind a page id such as `event/ends/end-1`, whether or not the wiki wrote that page */
export function entryForPageId(id: string, index: WikiPage | undefined, pages: WikiPage[], idPrefix: string, noun: string): EndingEntry | undefined {
  return endingEntries(index, pages, idPrefix, noun).find((e) => e.pageId === id);
}
