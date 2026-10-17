import type { Inline } from "../guide/wiki";

type Row = Inline[][][];

const plain = (cell: Inline[][]) => cell.map((line) => line.map((r) => r.text).join("")).join("");

/**
 * The wiki's tables do not mark a header row. A first row of short, link-free labels sitting above more rows
 * reads as one (觸發條件 / 事件內容 / 備註); anything else is data.
 */
export function looksLikeHeader(rows: Row[]): boolean {
  if (rows.length < 2) return false;
  const first = rows[0];
  const filled = first.filter((c) => plain(c) !== "");
  if (filled.length === 0) return false;
  return filled.every((c) => plain(c).length <= 12 && !c.some((line) => line.some((r) => r.to)));
}
