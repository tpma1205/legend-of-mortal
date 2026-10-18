import type { WikiKind } from "../../src/guide/wiki";

/** `people/characters/girl2` -> `people/characters`; a page alone in its folder (`system/skill`) is its own section */
export function sectionOf(id: string): string {
  const seg = id.split("/");
  return seg.length > 2 ? seg.slice(0, 2).join("/") : id;
}

export interface CoverageRow {
  section: string;
  total: number;
  converted: number;
  excludedReason: string | undefined;
}

export interface Coverage {
  rows: CoverageRow[];
  /** sections with pages that were not converted and have no registered reason; the run fails on these */
  unregistered: string[];
  /** registered exclusions that match no page any more (the wiki moved or the page is now converted) */
  staleExclusions: string[];
}

/**
 * Every wiki section is either converted or excluded on purpose, with a reason written down.
 * A page the converter drops without a registered reason is how whole areas (equipment, 變心夢) went missing.
 */
export function coverage(pages: { id: string; kind: WikiKind }[], wanted: WikiKind[], excluded: Record<string, string>): Coverage {
  const bySection = new Map<string, { total: number; converted: number }>();
  for (const p of pages) {
    const s = sectionOf(p.id);
    const row = bySection.get(s) ?? { total: 0, converted: 0 };
    row.total++;
    if (wanted.includes(p.kind)) row.converted++;
    bySection.set(s, row);
  }
  const rows = [...bySection].sort((a, b) => a[0].localeCompare(b[0])).map(([section, c]) => ({ section, ...c, excludedReason: excluded[section] }));
  return {
    rows,
    unregistered: rows.filter((r) => r.converted < r.total && !r.excludedReason).map((r) => r.section),
    staleExclusions: Object.keys(excluded).filter((s) => !bySection.has(s) || bySection.get(s)!.converted === bySection.get(s)!.total),
  };
}
