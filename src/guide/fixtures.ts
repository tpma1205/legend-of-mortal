const makeSource = () => ({ site: "巴哈姆特", url: "https://forum.gamer.com.tw/", version: "1.0.5", date: "2025-09-01" });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawFile = { routes: any[]; endings: any[]; events: any[] };

export function validFile(): RawFile {
  return {
    routes: [{ id: "longxiang", name: "龍湘線" }],
    endings: [{ id: "bad-1", name: "壞結局甲", kind: "be", conditions: ["道德過低"], keyEventIds: ["e-b"] }],
    events: [
      {
        id: "e-b", year: 1, month: 5, title: "後來的事件", trigger: "chained",
        routeIds: ["longxiang"], preconditions: [], sources: [makeSource()],
        options: [{ id: "o1", text: "離開", preconditions: [], consequence: {} }],
      },
      {
        id: "e-a", year: 1, month: 4, title: "起始事件", trigger: "timed",
        routeIds: ["longxiang"],
        preconditions: [{ kind: "time", text: "第一年四月" }],
        sources: [makeSource()],
        options: [
          {
            id: "o1", text: "出手相助", preconditions: [],
            consequence: {
              summary: "結識龍湘",
              statChanges: [{ stat: "好感度", delta: 5 }],
              nextEventIds: ["e-b"],
              saveHint: "sl",
            },
          },
          { id: "o2", text: "袖手旁觀", preconditions: [], consequence: { leadsTo: "be", endingId: "bad-1" } },
        ],
      },
    ],
  };
}
