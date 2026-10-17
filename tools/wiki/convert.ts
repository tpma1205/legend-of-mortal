import * as cheerio from "cheerio";
import type { Block, Inline, WikiKind, WikiPage } from "../../src/guide/wiki";

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|nbsp|#39);/g, (m) => ENTITIES[m] ?? m);

export function kindOf(id: string): WikiKind {
  if (id.startsWith("people/characters/")) return "character";
  if (id.startsWith("system/books/")) return "book";
  if (id === "system/skill") return "skill";
  if (id.startsWith("system/items")) return "item";
  if (id === "system/pills") return "pill";
  if (id.startsWith("event/ends/")) return "ending";
  if (id.startsWith("event/badends/")) return "badend";
  if (id.startsWith("event/achievements")) return "achievement";
  if (id.startsWith("event/pursuit") || id === "people/dream-sweetheart") return "pursuit";
  if (id.startsWith("event/simple/") || id.startsWith("event/detailed_description/")) return "event";
  return "other";
}

function parseFrontmatter(src: string): { title: string; tags: string[]; body: string } {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { title: "", tags: [], body: src };
  const title = m[1].match(/^title:\s*(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, "") ?? "";
  const tagBlock = m[1].match(/^tags:\s*\r?\n((?:\s+-\s*.+\r?\n?)+)/m)?.[1] ?? "";
  const tags = [...tagBlock.matchAll(/-\s*(.+)/g)].map((t) => t[1].trim());
  return { title, tags, body: src.slice(m[0].length) };
}

/** wiki href -> page id, or undefined for external/empty links */
export function hrefToId(href: string): string | undefined {
  if (/^[a-z]+:/i.test(href) || href.startsWith("#")) return undefined;
  let p = href.split("#")[0].replace(/^\/+/, "").replace(/\.(html|md)$/, "");
  if (!p) return undefined;
  try {
    p = decodeURIComponent(p);
  } catch {
    // keep raw path when it isn't valid percent-encoding
  }
  return p.endsWith("/") ? `${p}index` : p;
}

const INLINE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^)\s]+)\)|<span\b[^>]*?title="([^"]*)"[^>]*>([\s\S]*?)<\/span>/g;

const plain = (s: string) =>
  decode(
    s
      .replace(/<\/?[A-Za-z][^>]*>/g, "")
      .replace(/\*\*|__/g, "")
      .replace(/\s+/g, " "),
  );

/** one line of markdown/html -> inline runs */
function inline(line: string): Inline[] {
  const out: Inline[] = [];
  const push = (text: string, extra: Partial<Inline> = {}) => {
    if (text !== "") out.push({ text, ...extra });
  };
  let last = 0;
  for (const m of line.matchAll(INLINE)) {
    push(plain(line.slice(last, m.index)));
    if (m[1]) push(plain(m[2] ?? m[1]), { to: `@${m[1].split("#")[0].trim()}` });
    else if (m[3]) {
      const to = hrefToId(m[4]);
      push(plain(m[3]), to ? { to } : {});
    } else push(plain(m[6]), { note: plain(m[5]).trim() });
    last = m.index! + m[0].length;
  }
  push(plain(line.slice(last)));
  return trimRuns(out);
}

function trimRuns(runs: Inline[]): Inline[] {
  if (runs.length === 0) return runs;
  runs[0] = { ...runs[0], text: runs[0].text.replace(/^\s+/, "") };
  const l = runs.length - 1;
  runs[l] = { ...runs[l], text: runs[l].text.replace(/\s+$/, "") };
  return runs.filter((r) => r.text !== "");
}

const lines = (html: string): Inline[][] =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map(inline)
    .filter((l) => l.length > 0);

const ATTR = `(?:\\s+(?:"[^"]*"|'[^']*'|[^'">/])*)?`;
const SELF_CLOSING = new RegExp(`<([A-Z][\\w]*)${ATTR}\\s*/>`, "g");
const OPEN_TAG = new RegExp(`<([A-Z][\\w]*)${ATTR}\\s*>`, "g");

function cleanChunk(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ChMeet\b([\s\S]*?)\/>/g, (_, attrs: string) => {
      const get = (k: string) => attrs.match(new RegExp(`${k}='([\\s\\S]*?)'`))?.[1] ?? "";
      return [get("nameTitle"), get("nameMain"), get("desc")].filter(Boolean).join("<br>") + "\n";
    })
    .replace(/<img\b[^>]*>/gi, "")
    .replace(SELF_CLOSING, "")
    .replace(OPEN_TAG, (m, name: string) => (/^(Girl\d+Icon|[A-Z]\w*Icon)$/.test(name) ? m : ""))
    .replace(/<\/(?:[A-Z]\w*)>/g, (m) => (/Icon>$/.test(m) ? m : ""))
    .replace(/title="([^"]*)"/g, (_, t: string) => `title="${t.replace(/\s+/g, " ")}"`)
    .split("\n")
    .filter((l) => !/^\s*<\/?[A-Za-z][^>]*>\s*$/.test(l) && !/^\s*\{\{.*\}\}\s*$/.test(l) && !/^#\s*\{\{.*\}\}/.test(l))
    .join("\n");
}

function tableBlock(html: string): Block {
  const $ = cheerio.load(html);
  const rows: Inline[][][][] = [];
  $("tr").each((_, tr) => {
    const cells = $(tr)
      .children("td,th")
      .map((__, c) => [lines($(c).html() ?? "")])
      .get() as unknown as Inline[][][];
    if (cells.length) rows.push(cells);
  });
  return { type: "table", rows };
}

function textBlocks(chunk: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { depth: number; text: Inline[] }[] = [];
  let ordered = false;
  const flushPara = () => {
    if (para.length) for (const l of lines(para.join(""))) blocks.push({ type: "p", text: l });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "list", items: list, ordered });
    list = [];
  };
  // footnote markers are dropped; "[^1]: text" definitions become "註1：text" lines
  const withNotes = cleanChunk(chunk)
    .split("\n")
    .flatMap((l) =>
      /^\s*\[\^\d+\]:/.test(l)
        ? l.split(/(?=\[\^\d+\]:)/).flatMap((d) => [d.replace(/^\[\^(\d+)\]:\s*/, "註$1："), ""])
        : [l.replace(/\[\^\d+\]/g, "")],
    );
  for (const raw of withNotes) {
    const line = raw
      .replace(/\s+$/, "")
      .replace(/^\s*:::\s*(?:details|tip|warning|info|danger|note)?\s*/, "")
      .replace(/\s*:::\s*$/, "")
      .replace(/^>\s?/, "");
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    const li = line.match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (h) {
      flushPara();
      flushList();
      blocks.push({ type: "h", level: h[1].length, text: inline(h[2].replace(/<br\s*\/?>/gi, " ")) });
    } else if (li) {
      flushPara();
      if (list.length === 0) ordered = /\d/.test(li[2]);
      const depth = li[1].length === 0 ? 0 : Math.ceil(li[1].replace(/\t/g, "    ").length / 3);
      for (const l of lines(li[3])) list.push({ depth, text: l });
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return blocks;
}

/** the wiki draws tables with its own vue components; read them as plain tables */
const normalizeTables = (s: string) =>
  s
    .replace(/<(\/?)(?:BTable|Btable|ChTable)\b[^>]*>/g, "<$1table>")
    .replace(/<(\/?)ChTr\b[^>]*>/g, "<$1tr>")
    .replace(/<(\/?)ChTd\b[^>]*>/g, "<$1td>");

export function convertPage(id: string, src: string): WikiPage {
  const { title, tags, body } = parseFrontmatter(src);
  const blocks: Block[] = [];
  const parts = normalizeTables(body.replace(/<!--[\s\S]*?-->/g, "")).split(/(<table\b[\s\S]*?<\/table>)/i);
  for (const part of parts) {
    if (/^<table\b/i.test(part)) blocks.push(tableBlock(part));
    else blocks.push(...textBlocks(part));
  }
  return { id, kind: kindOf(id), title, tags, blocks };
}
