import { describe, expect, it } from "vitest";
import { GuideValidationError, loadGuide } from "./loadGuide";
import { validFile, type RawFile } from "./fixtures";

const withEdit = (edit: (f: RawFile) => void) => {
  const f = validFile();
  edit(f);
  return [f];
};
const issuesOf = (files: unknown[]) => {
  try {
    loadGuide(files);
  } catch (e) {
    if (e instanceof GuideValidationError) return e.issues.join("\n");
    throw e;
  }
  return "";
};

describe("loadGuide", () => {
  it("loads valid data and orders events by time", () => {
    const guide = loadGuide([validFile()]);
    expect(guide.events.map((e) => e.id)).toEqual(["e-a", "e-b"]);
    expect(guide.eventById.get("e-a")?.title).toBe("起始事件");
  });

  it("derives backlinks from option consequences", () => {
    const guide = loadGuide([validFile()]);
    expect(guide.incoming.get("e-b")).toEqual([{ eventId: "e-a", optionId: "o1" }]);
    expect(guide.incoming.has("e-a")).toBe(false);
  });

  it("merges events across several files", () => {
    const f = validFile();
    const a = { ...f, events: [f.events[0]], routes: f.routes, endings: [] };
    const b = { routes: [], endings: f.endings, events: [f.events[1]] };
    expect(loadGuide([a, b]).events).toHaveLength(2);
  });

  it("rejects an event without a source", () => {
    expect(issuesOf(withEdit((f) => (f.events[0].sources = [])))).toContain("sources");
  });

  it("rejects a source without a game version", () => {
    expect(issuesOf(withEdit((f) => delete f.events[0].sources[0].version))).toContain("version");
  });

  it("rejects a link to a missing event", () => {
    const out = issuesOf(withEdit((f) => (f.events[1].options[0].consequence.nextEventIds = ["nope"])));
    expect(out).toContain("unknown next event nope");
  });

  it("rejects a link to a missing ending or route", () => {
    expect(issuesOf(withEdit((f) => (f.events[1].options[1].consequence.endingId = "zzz")))).toContain("unknown ending zzz");
    expect(issuesOf(withEdit((f) => (f.events[0].routeIds = ["zzz"])))).toContain("unknown route zzz");
  });

  it("rejects duplicate event ids", () => {
    expect(issuesOf(withEdit((f) => (f.events[1].id = "e-b")))).toContain("duplicate event id: e-b");
  });

  it("rejects a chained event nothing leads to", () => {
    expect(issuesOf(withEdit((f) => (f.events[1].options[0].consequence.nextEventIds = [])))).toContain("orphan chained event: e-b");
  });

  it("accepts branch cycles", () => {
    const out = issuesOf(
      withEdit((f) => {
        f.events[1].trigger = "chained";
        f.events[0].options[0].consequence = { nextEventIds: ["e-a"] };
      }),
    );
    expect(out).toBe("");
  });
});
