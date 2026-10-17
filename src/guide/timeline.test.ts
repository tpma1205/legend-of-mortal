import { describe, expect, it } from "vitest";
import { buildTimeline, parseEventId } from "./timeline";
import type { WikiPage } from "./wiki";

describe("parseEventId", () => {
  it("reads year, month and period from wiki event ids", () => {
    expect(parseEventId("event/simple/1-04-1-偷懶怪")).toEqual({ year: 1, month: 4, period: 1 });
    expect(parseEventId("event/detailed_description/4-02-2-東西武林盟會戰")).toEqual({ year: 4, month: 2, period: 2 });
  });

  it("treats 0-0-0 as an event that can happen any time", () => {
    expect(parseEventId("event/simple/0-0-0-四師兄閒聊")).toEqual({ year: 0, month: 0, period: 0 });
  });

  it("returns undefined for ids that are not dated events", () => {
    expect(parseEventId("event/simple/index")).toBeUndefined();
    expect(parseEventId("people/characters/girl2")).toBeUndefined();
  });
});

const ev = (id: string, title: string): WikiPage => ({ id, kind: "event", title, tags: [], blocks: [] });

describe("buildTimeline", () => {
  it("groups events by year then month, ordered by period", () => {
    const tl = buildTimeline([ev("event/simple/1-05-2-乙", "乙"), ev("event/simple/1-04-3-丙", "丙"), ev("event/simple/1-04-1-甲", "甲"), ev("event/simple/0-0-0-任意", "任意")]);
    expect(tl.map((y) => y.year)).toEqual([0, 1]);
    const y1 = tl[1].months;
    expect(y1.map((m) => m.month)).toEqual([4, 5]);
    expect(y1[0].events.map((e) => e.title)).toEqual(["甲", "丙"]);
  });

  it("drops events whose id carries no date", () => {
    expect(buildTimeline([ev("event/simple/index", "索引")])).toEqual([]);
  });
});
