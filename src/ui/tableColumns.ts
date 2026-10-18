import type { Inline } from "../guide/wiki";

type Row = Inline[][][];

const text = (cell: Inline[][] | undefined) => (cell ?? []).map((line) => line.map((r) => r.text).join("")).join("").trim();
const isBlank = (cell: Inline[][] | undefined) => /^[-－—–]*$/.test(text(cell));

/**
 * Which columns of a table to show. A column whose body cells are all empty or a dash carries nothing,
 * so it is left out and the others get its width. The header row (when there is one) is not consulted.
 * At least one column always stays.
 */
export function visibleColumns(rows: Row[], hasHeader: boolean): number[] {
  const width = Math.max(0, ...rows.map((r) => r.length));
  const all = Array.from({ length: width }, (_, i) => i);
  const body = hasHeader ? rows.slice(1) : rows;
  if (body.length === 0) return all;
  const keep = all.filter((c) => body.some((r) => !isBlank(r[c])));
  return keep.length ? keep : all;
}

const longestLine = (cell: Inline[][] | undefined) => Math.max(0, ...(cell ?? []).map((line) => line.map((r) => r.text).join("").length));

/**
 * A minimum width (rem) for each column: room for its longest line (about 1rem per character, cell padding
 * included), capped at 18rem. Without it the browser may squeeze a column of Chinese text down to one character
 * per line when a table has many columns; a table that needs more room than the page has scrolls sideways instead.
 */
export function columnMinWidths(rows: Row[], cols: number[]): number[] {
  return cols.map((c) => Math.min(16, Math.max(1, ...rows.map((r) => longestLine(r[c])))) + 2);
}
