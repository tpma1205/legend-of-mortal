import { useState } from "react";
import type { Guide } from "../guide/loadGuide";
import type { GuideOption, Source } from "../guide/schema";
import { eventHref, endingHref } from "./route";

const sign = (n: number) => (n > 0 ? `+${n}` : String(n));

function Sources({ sources }: { sources: Source[] }) {
  return (
    <ul className="sources">
      {sources.map((s) => (
        <li key={s.url + s.version}>
          <a href={s.url} target="_blank" rel="noreferrer">
            {s.site}
          </a>
          <span>
            版本 {s.version}・{s.date}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Consequence({ guide, option }: { guide: Guide; option: GuideOption }) {
  const c = option.consequence;
  const ending = c.endingId ? guide.endings.find((e) => e.id === c.endingId) : undefined;
  const empty =
    !c.summary &&
    !c.statChanges.length &&
    !c.unlocks.length &&
    !c.misses.length &&
    !c.nextEventIds.length &&
    !ending &&
    !c.saveHint &&
    !c.alternatives.length;
  return (
    <div className="consequence">
      {empty && <p className="unknown">來源未記載此選項的後果。</p>}
      {c.summary && <p>{c.summary}</p>}
      {c.statChanges.length > 0 && (
        <p className="meta">
          數值：
          {c.statChanges
            .map((s) => `${s.stat}${s.delta !== undefined ? sign(s.delta) : ""}${s.text ? `（${s.text}）` : ""}`)
            .join("、")}
        </p>
      )}
      {c.unlocks.length > 0 && <p className="meta">解鎖：{c.unlocks.join("、")}</p>}
      {c.misses.length > 0 && <p className="meta warn">錯過：{c.misses.join("、")}</p>}
      {ending && (
        <p className={c.leadsTo === "be" || ending.kind === "be" ? "meta warn" : "meta"}>
          通往{ending.kind === "be" ? "壞結局" : "結局"}：<a href={endingHref(ending.id)}>{ending.name}</a>
        </p>
      )}
      {c.nextEventIds.length > 0 && (
        <p className="meta">
          後續事件：
          {c.nextEventIds.map((id, i) => (
            <span key={id}>
              {i > 0 && "、"}
              <a href={eventHref(id)}>{guide.eventById.get(id)?.title ?? id}</a>
            </span>
          ))}
        </p>
      )}
      {c.saveHint && (
        <p className="save-hint">
          {c.saveHint === "irreversible" ? "不可逆分歧，建議先存檔" : "需要 SL 才能達成理想結果，建議先存檔"}
        </p>
      )}
      {c.alternatives.length > 0 && (
        <div className="conflict">
          <p className="meta">其他來源的說法不同：</p>
          <ul>
            {c.alternatives.map((a) => (
              <li key={a.source.url + a.summary}>
                {a.summary}（
                <a href={a.source.url} target="_blank" rel="noreferrer">
                  {a.source.site}
                </a>
                ，版本 {a.source.version}）
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OptionItem({ guide, option, revealAll }: { guide: Guide; option: GuideOption; revealAll: boolean }) {
  const [open, setOpen] = useState(false);
  const shown = open || revealAll;
  return (
    <li className="option">
      <button aria-expanded={shown} onClick={() => setOpen(!open)} disabled={revealAll}>
        <span className="option-text">{option.text}</span>
        <span className="hint">{shown ? "後果" : "看後果"}</span>
      </button>
      {option.preconditions.length > 0 && (
        <p className="meta">出現條件：{option.preconditions.map((p) => p.text).join("；")}</p>
      )}
      {shown && <Consequence guide={guide} option={option} />}
    </li>
  );
}

export function EventView({ guide, id, revealAll }: { guide: Guide; id: string; revealAll: boolean }) {
  const event = guide.eventById.get(id);
  if (!event) return <p className="empty">找不到這個事件。</p>;
  const incoming = guide.incoming.get(id) ?? [];
  return (
    <article className="event">
      <header>
        <p className="when">
          第{event.year}年 {event.month}月
        </p>
        <h1>{event.title}</h1>
        {event.routeIds.length > 0 && (
          <p className="chips">
            {event.routeIds.map((r) => (
              <span key={r}>{guide.routes.find((x) => x.id === r)?.name ?? r}</span>
            ))}
          </p>
        )}
      </header>
      {event.preconditions.length > 0 && (
        <section>
          <h2>觸發條件</h2>
          <ul className="plain">
            {event.preconditions.map((p) => (
              <li key={p.text}>{p.text}</li>
            ))}
          </ul>
        </section>
      )}
      {incoming.length > 0 && (
        <section>
          <h2>由這些選擇觸發</h2>
          <ul className="plain">
            {incoming.map((b) => {
              const from = guide.eventById.get(b.eventId);
              const opt = from?.options.find((o) => o.id === b.optionId);
              return (
                <li key={b.eventId + b.optionId}>
                  <a href={eventHref(b.eventId)}>{from?.title}</a>：{opt?.text}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <section>
        <h2>選項</h2>
        {event.options.length === 0 ? (
          <p className="unknown">此事件沒有可選項目。</p>
        ) : (
          <ul className="options">
            {event.options.map((o) => (
              <OptionItem key={o.id} guide={guide} option={o} revealAll={revealAll} />
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2>資料來源</h2>
        <Sources sources={event.sources} />
      </section>
    </article>
  );
}
