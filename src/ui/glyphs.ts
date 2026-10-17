/** Splits text into plain runs and runs of colour emoji, so the emoji can be toned down to the ink palette. */
const EMOJI = /(\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*)/gu;

export interface GlyphRun {
  text: string;
  glyph: boolean;
}

export function splitGlyphs(text: string): GlyphRun[] {
  return text
    .split(EMOJI)
    .filter((t) => t !== "")
    .map((t) => ({ text: t, glyph: new RegExp(`^${EMOJI.source}$`, "u").test(t) }));
}
