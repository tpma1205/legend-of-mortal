import { describe, expect, it } from "vitest";
import { looksLikeHeader } from "./tableHeader";
import type { Inline } from "../guide/wiki";

const cell = (text: string, to?: string): Inline[][] => [[to ? { text, to } : { text }]];
const row = (...t: string[]) => t.map((x) => cell(x));

describe("looksLikeHeader", () => {
  it("treats a short, link-free first row above more rows as a header", () => {
    expect(looksLikeHeader([row("觸發條件", "事件內容", "備註"), row("-", "很長很長的一段事件說明文字", "-")])).toBe(true);
  });

  it("does not treat a single row as a header", () => {
    expect(looksLikeHeader([row("觸發條件", "事件內容")])).toBe(false);
  });

  it("rejects a first row with a long cell", () => {
    expect(looksLikeHeader([row("這是一段超過十二個字的很長很長的說明文字", "乙"), row("a", "b")])).toBe(false);
  });

  it("rejects a first row that contains links (it is data)", () => {
    expect(looksLikeHeader([[cell("甲", "event/x"), cell("乙")], row("a", "b")] as never)).toBe(false);
  });

  it("rejects a first row with empty cells only", () => {
    expect(looksLikeHeader([[[], []], row("a", "b")] as never)).toBe(false);
  });
});
