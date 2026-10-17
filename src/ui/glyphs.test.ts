import { describe, expect, it } from "vitest";
import { splitGlyphs } from "./glyphs";

describe("splitGlyphs", () => {
  it("separates emoji from the text around them", () => {
    expect(splitGlyphs("👉選擇：大師兄")).toEqual([
      { text: "👉", glyph: true },
      { text: "選擇：大師兄", glyph: false },
    ]);
  });

  it("keeps emoji with a variation selector as one glyph", () => {
    expect(splitGlyphs("⚔️戰役")).toEqual([
      { text: "⚔️", glyph: true },
      { text: "戰役", glyph: false },
    ]);
  });

  it("returns plain text untouched, and nothing for an empty string", () => {
    expect(splitGlyphs("沒有表情符號")).toEqual([{ text: "沒有表情符號", glyph: false }]);
    expect(splitGlyphs("")).toEqual([]);
  });

  it("does not treat digits or CJK punctuation as emoji", () => {
    expect(splitGlyphs("【≧80】100%")).toEqual([{ text: "【≧80】100%", glyph: false }]);
  });
});
