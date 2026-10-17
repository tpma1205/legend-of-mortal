/** A run of text; `to` links to another wiki page (by id) or, as `@名稱`, to a named entity. */
export interface Inline {
  text: string;
  to?: string;
  /** hover tooltip from the wiki (e.g. stat changes next to a choice) */
  note?: string;
}

export type Block =
  | { type: "h"; level: number; text: Inline[] }
  | { type: "p"; text: Inline[] }
  | { type: "list"; items: { depth: number; text: Inline[] }[]; ordered: boolean }
  | { type: "table"; rows: Inline[][][][] };  // rows[row][cell][line][run]

/** One wiki page, converted to plain structure (no HTML, no images). */
export interface WikiPage {
  /** wiki path without extension, e.g. `system/books/book_4001` */
  id: string;
  kind: WikiKind;
  title: string;
  tags: string[];
  blocks: Block[];
}

export type WikiKind =
  | "character"
  | "book"
  | "skill"
  | "item"
  | "pill"
  | "ending"
  | "badend"
  | "achievement"
  | "pursuit"
  | "event"
  | "other";

export interface WikiDataset {
  source: { site: string; url: string; license: string; commit: string; version: string; date: string };
  pages: WikiPage[];
  /** pages the converter could not turn into blocks, with the reason */
  skipped: { id: string; reason: string }[];
}
