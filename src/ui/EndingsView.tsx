import type { Guide } from "../guide/loadGuide";
import { eventHref } from "./route";

const KIND = { good: "好結局", be: "壞結局", neutral: "一般結局" } as const;

function leadingOptions(guide: Guide, endingId: string) {
  return guide.events.flatMap((ev) =>
    ev.options.filter((o) => o.consequence.endingId === endingId).map((o) => ({ event: ev, option: o })),
  );
}

export function EndingsView({ guide, focusId }: { guide: Guide; focusId?: string }) {
  if (guide.endings.length === 0) return <p className="empty">尚未收錄結局資料。</p>;
  return (
    <article className="event">
      <header>
        <h1>結局一覽</h1>
      </header>
      {guide.endings.map((e) => {
        const leading = leadingOptions(guide, e.id);
        return (
        <section key={e.id} id={e.id} className={e.id === focusId ? "ending focus" : "ending"}>
          <h2>
            {e.name}
            <span className={`kind ${e.kind}`}>{KIND[e.kind]}</span>
          </h2>
          {e.conditions.length > 0 && (
            <ul className="plain">
              {e.conditions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          {e.keyEventIds.length > 0 && (
            <p className="meta">
              必經事件：
              {e.keyEventIds.map((id, i) => (
                <span key={id}>
                  {i > 0 && "、"}
                  <a href={eventHref(id)}>{guide.eventById.get(id)?.title ?? id}</a>
                </span>
              ))}
            </p>
          )}
          {leading.length > 0 && (
            <p className="meta">
              會走到這裡的選項：
              {leading.map(({ event, option }, i) => (
                <span key={event.id + option.id}>
                  {i > 0 && "、"}
                  <a href={eventHref(event.id)}>
                    {event.title}・{option.text}
                  </a>
                </span>
              ))}
            </p>
          )}
        </section>
        );
      })}
    </article>
  );
}
