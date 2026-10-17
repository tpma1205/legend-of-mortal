import type { WikiPage } from "./wiki";

export interface EventTime {
  /** 1-4; 0 means the event can happen at any time */
  year: number;
  month: number;
  /** 1 上旬, 2 中旬, 3 下旬; 0 when unspecified */
  period: number;
}

/** Wiki event pages are named `<year>-<month>-<period>-<title>`. */
export function parseEventId(id: string): EventTime | undefined {
  const m = id.match(/^event\/(?:simple|detailed_description)\/(\d)-(\d{1,2})-(\d)-/);
  return m ? { year: Number(m[1]), month: Number(m[2]), period: Number(m[3]) } : undefined;
}

export interface TimelineEvent extends EventTime {
  id: string;
  title: string;
}

export interface TimelineYear {
  year: number;
  months: { month: number; events: TimelineEvent[] }[];
}

export function buildTimeline(events: WikiPage[]): TimelineYear[] {
  const dated: TimelineEvent[] = [];
  for (const e of events) {
    const t = parseEventId(e.id);
    if (t) dated.push({ ...t, id: e.id, title: e.title });
  }
  dated.sort((a, b) => a.year - b.year || a.month - b.month || a.period - b.period || a.id.localeCompare(b.id, "zh-Hant", { numeric: true }));
  const years: TimelineYear[] = [];
  for (const e of dated) {
    let y = years.find((x) => x.year === e.year);
    if (!y) years.push((y = { year: e.year, months: [] }));
    let m = y.months.find((x) => x.month === e.month);
    if (!m) y.months.push((m = { month: e.month, events: [] }));
    m.events.push(e);
  }
  return years;
}
