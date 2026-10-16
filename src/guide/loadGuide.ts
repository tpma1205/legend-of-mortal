import { GuideFileSchema, type Ending, type GuideEvent, type Route } from "./schema";

export interface Backlink {
  eventId: string;
  optionId: string;
}

export interface Guide {
  events: GuideEvent[];
  eventById: Map<string, GuideEvent>;
  routes: Route[];
  endings: Ending[];
  incoming: Map<string, Backlink[]>;
}

export class GuideValidationError extends Error {
  constructor(public issues: string[]) {
    super(`Guide data invalid:\n- ${issues.join("\n- ")}`);
  }
}

export function loadGuide(files: unknown[]): Guide {
  const issues: string[] = [];
  const events: GuideEvent[] = [];
  const routes: Route[] = [];
  const endings: Ending[] = [];

  files.forEach((raw, i) => {
    const parsed = GuideFileSchema.safeParse(raw);
    if (!parsed.success) {
      for (const p of parsed.error.issues) issues.push(`file ${i}: ${p.path.join(".")}: ${p.message}`);
      return;
    }
    events.push(...parsed.data.events);
    for (const r of parsed.data.routes) {
      const known = routes.find((x) => x.id === r.id);
      if (!known) routes.push(r);
      else if (known.name !== r.name) issues.push(`route id ${r.id} declared with different names`);
    }
    for (const e of parsed.data.endings) {
      const known = endings.find((x) => x.id === e.id);
      if (!known) endings.push({ ...e });
      else if (known.name !== e.name) issues.push(`ending id ${e.id} declared with different names`);
      else {
        known.conditions = [...new Set([...known.conditions, ...e.conditions])];
        known.keyEventIds = [...new Set([...known.keyEventIds, ...e.keyEventIds])];
      }
    }
  });

  const unique = (kind: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) issues.push(`duplicate ${kind} id: ${id}`);
      seen.add(id);
    }
    return seen;
  };
  const eventIds = unique("event", events.map((e) => e.id));
  const routeIds = unique("route", routes.map((r) => r.id));
  const endingIds = unique("ending", endings.map((e) => e.id));

  const incoming = new Map<string, Backlink[]>();
  for (const e of events) {
    unique(`option in ${e.id}`, e.options.map((o) => o.id));
    for (const r of e.routeIds) if (!routeIds.has(r)) issues.push(`${e.id}: unknown route ${r}`);
    for (const o of e.options) {
      const c = o.consequence;
      if (c.endingId && !endingIds.has(c.endingId)) issues.push(`${e.id}/${o.id}: unknown ending ${c.endingId}`);
      for (const next of c.nextEventIds) {
        if (!eventIds.has(next)) {
          issues.push(`${e.id}/${o.id}: unknown next event ${next}`);
          continue;
        }
        incoming.set(next, [...(incoming.get(next) ?? []), { eventId: e.id, optionId: o.id }]);
      }
    }
  }
  for (const e of endings) {
    for (const id of e.keyEventIds) if (!eventIds.has(id)) issues.push(`ending ${e.id}: unknown key event ${id}`);
  }
  for (const e of events) {
    if (e.trigger === "chained" && !incoming.has(e.id)) issues.push(`orphan chained event: ${e.id}`);
  }

  if (issues.length) throw new GuideValidationError(issues);

  events.sort((a, b) => a.year - b.year || a.month - b.month || a.id.localeCompare(b.id));
  return { events, eventById: new Map(events.map((e) => [e.id, e])), routes, endings, incoming };
}
