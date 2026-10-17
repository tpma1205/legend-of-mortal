import type { WikiKind } from "../guide/wiki";

export interface Section {
  id: string;
  label: string;
  kinds: WikiKind[];
}

/** Wiki-backed top-level areas. The timeline ("攻略") is separate. */
export const SECTIONS: Section[] = [
  { id: "characters", label: "人物", kinds: ["character"] },
  { id: "books", label: "秘笈與技能", kinds: ["book", "skill"] },
  { id: "items", label: "道具、裝備與煉丹", kinds: ["item", "pill", "forge"] },
  { id: "endings", label: "結局系列", kinds: ["ending", "badend", "achievement"] },
  { id: "pursuit", label: "夢境心上人", kinds: ["pursuit"] },
  { id: "mechanism", label: "遊戲機制", kinds: ["mechanism"] },
];

export const KIND_LABEL: Record<WikiKind, string> = {
  character: "人物",
  book: "秘笈",
  skill: "技能",
  item: "道具",
  pill: "丹藥",
  ending: "汗青書",
  badend: "生死簿",
  achievement: "風雲史",
  pursuit: "夢境心上人",
  event: "事件",
  mechanism: "遊戲機制",
  forge: "裝備與煉丹",
  other: "其他",
};

export function sectionOfKind(kind: WikiKind): Section | undefined {
  return SECTIONS.find((s) => s.kinds.includes(kind));
}
