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
  if (id.startsWith("other/guide/")) return "mechanism";
  if (id === "system/develop-list" || id === "system/forge-roadmap") return "forge";
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

const INLINE = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]|\[((?:\\.|[^\]\\])+)\]\(([^)\s]+)\)|<span\b[^>]*?title="([^"]*)"[^>]*>([\s\S]*?)<\/span>|\|\|(.+?)\|\||~~(.+?)~~/g;

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
    if (m[1]) push(plain(m[2] || m[1]), { to: `@${m[1].split("#")[0].trim()}` });
    else if (m[3]) {
      const to = hrefToId(m[4]);
      const text = plain(m[3].replace(/\\([[\]])/g, "$1"));
      push(text, to ? { to } : /^https?:/i.test(m[4]) ? { href: m[4] } : {});
    } else if (m[6] !== undefined) {
      const note = plain(m[5]).trim();
      out.push(...inline(m[6]).map((r) => ({ ...r, note: r.note ?? note })));
    } else if (m[7] !== undefined) out.push(...inline(m[7]).map((r) => ({ ...r, spoiler: true })));
    else out.push(...inline(m[8]).map((r) => ({ ...r, strike: true })));
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
    // a [[link]] whose name runs across a <br> stays one link
    .replace(/\[\[[^\]]*\]\]/g, (m) => m.replace(/<br\s*\/?>/gi, " "))
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

/** a source newline inside a table cell is a soft wrap (the wiki's browser shows a space, or nothing between CJK) */
const softWrap = (html: string) => html.replace(/\s*\n\s*/g, " ").replace(/(?<=[^\x00-\x7F])\s+(?=[^\x00-\x7F])/g, "");

/** rows[row][cell][line][run]; rowspan repeats the cell, colspan leaves empty cells, so every row has the same columns */
function tableBlock(html: string): Block {
  const $ = cheerio.load(html);
  const rows: Inline[][][][] = [];
  const carry: { left: number; cell: Inline[][] }[] = [];
  $("tr").each((_, tr) => {
    const row: Inline[][][] = [];
    let col = 0;
    const fillCarried = () => {
      while ((carry[col]?.left ?? 0) > 0) {
        row[col] = carry[col].cell;
        carry[col].left--;
        col++;
      }
    };
    $(tr)
      .children("td,th")
      .each((__, c) => {
        fillCarried();
        const cell = lines(softWrap($(c).html() ?? ""));
        const colspan = Math.max(1, Number($(c).attr("colspan")) || 1);
        const rowspan = Math.max(1, Number($(c).attr("rowspan")) || 1);
        for (let k = 0; k < colspan; k++) {
          row[col] = k === 0 ? cell : [];
          if (rowspan > 1) carry[col] = { left: rowspan - 1, cell: row[col] };
          col++;
        }
      });
    fillCarried();
    if (row.length) rows.push(row);
  });
  return { type: "table", rows };
}

const FENCE = /^\s*```\s*([\w-]*)\s*$/;
const HR = /^\s*(?:-{3,}|\*{3,})\s*$/;
const PIPE_ROW = /^\s*\|.*\|\s*$/;
const PIPE_SEP = /^\s*\|?(?:\s*:?-{2,}:?\s*\|)+\s*:?-*:?\s*$/;

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "");

/**
 * A mermaid flowchart of upgrades (A --> B) read as an indented list: what each item needs, and what it upgrades into.
 * Dotted edges are refunds; their label becomes one note under the list.
 */
function mermaidBlocks(source: string): Block[] {
  const nodes = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();
  const refunds = new Set<string>();
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("%%")) continue;
    const edge = line.match(/^([A-Za-z]\w*)\s*(-->|-\.->)\s*(?:\|([^|]*)\|\s*)?([A-Za-z]\w*)$/);
    if (edge) {
      if (edge[2] === "-->") {
        children.set(edge[1], [...(children.get(edge[1]) ?? []), edge[4]]);
        hasParent.add(edge[4]);
      } else if (edge[3]) refunds.add(plain(stripTags(edge[3])).trim());
      continue;
    }
    const node = line.match(/^([A-Za-z]\w*)\[(.*?)\]?$/);
    if (node && !/^(?:style|linkStyle|classDef|subgraph|graph|end)\b/.test(line)) {
      const label = node[2]
        .replace(/<img\b[^>]*>/gi, "")
        .split(/<br\s*\/?>/i)
        .map((l) => plain(l).trim())
        .filter(Boolean);
      if (label.length) nodes.set(node[1], label);
    }
  }
  if (nodes.size === 0) return [{ type: "code", text: source }];
  const text = (id: string): Inline[] => {
    const [name, ...rest] = nodes.get(id) ?? [id];
    return [{ text: rest.length ? `${name}（${rest.join("，")}）` : name }];
  };
  const items: { depth: number; text: Inline[] }[] = [];
  const walk = (id: string, depth: number, path: string[]) => {
    items.push({ depth, text: text(id) });
    for (const c of children.get(id) ?? []) if (!path.includes(c)) walk(c, depth + 1, [...path, c]);
  };
  for (const id of nodes.keys()) if (!hasParent.has(id)) walk(id, 0, [id]);
  const blocks: Block[] = [{ type: "list", items, ordered: false }];
  if (refunds.size) blocks.push({ type: "p", text: [{ text: `退還：${[...refunds].join("；")}` }] });
  return blocks;
}

function textBlocks(chunk: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { depth: number; no?: number; text: Inline[] }[] = [];
  let ordered = false;
  const flushPara = () => {
    if (para.length) for (const l of lines(para.join(""))) blocks.push({ type: "p", text: l });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "list", items: list, ordered });
    list = [];
  };
  const flush = () => {
    flushPara();
    flushList();
  };
  // footnote markers are dropped; "[^1]: text" definitions become "註1：text" lines
  const withNotes = cleanChunk(chunk)
    .split("\n")
    .flatMap((l) =>
      /^\s*\[\^\d+\]:/.test(l)
        ? l.split(/(?=\[\^\d+\]:)/).flatMap((d) => [d.replace(/^\[\^(\d+)\]:\s*/, "註$1："), ""])
        : [l.replace(/\[\^\d+\]/g, "")],
    );

  // split off fenced code first: its lines must not be read as markdown
  const rows: ({ text: string } | { fence: string; body: string[] })[] = [];
  for (let i = 0; i < withNotes.length; i++) {
    const f = withNotes[i].match(FENCE);
    if (!f) {
      rows.push({ text: withNotes[i] });
      continue;
    }
    const body: string[] = [];
    for (i++; i < withNotes.length && !FENCE.test(withNotes[i]); i++) body.push(withNotes[i]);
    rows.push({ fence: f[1], body });
  }

  const textRows = (items: { text: string }[]) => {
    const src = items.map((r) =>
      r.text
        .replace(/\s+$/, "")
        .replace(/^\s*:::\s*(?:details|tip|warning|info|danger|note)?\s*/, "")
        .replace(/\s*:::\s*$/, "")
        .replace(/^>\s?/, ""),
    );
    for (let i = 0; i < src.length; i++) {
      const line = src[i];
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      const li = line.match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
      if (!line.trim()) flush();
      else if (HR.test(line)) {
        flush();
        blocks.push({ type: "hr" });
      } else if (PIPE_ROW.test(line) && i + 1 < src.length && PIPE_SEP.test(src[i + 1])) {
        flush();
        const cells = (row: string) =>
          row
            .trim()
            .replace(/^\||\|$/g, "")
            .split(/\|(?![^[]*\]\])/) // not the pipe of a [[name|alias]] link
            .map((c) => lines(c.trim()));
        const table: Inline[][][][] = [cells(line)];
        for (i += 2; i < src.length && PIPE_ROW.test(src[i]); i++) table.push(cells(src[i]));
        i--;
        blocks.push({ type: "table", rows: table });
      } else if (h) {
        flush();
        blocks.push({ type: "h", level: h[1].length, text: inline(h[2].replace(/<br\s*\/?>/gi, " ")) });
      } else if (li) {
        flushPara();
        if (list.length === 0) ordered = /\d/.test(li[2]);
        const depth = li[1].length === 0 ? 0 : Math.ceil(li[1].replace(/\t/g, "    ").length / 3);
        const no = /^\d+\./.test(li[2]) ? parseInt(li[2], 10) : undefined;
        lines(li[3]).forEach((l, k) => list.push({ depth, ...(no !== undefined && k === 0 ? { no } : {}), text: l }));
      } else {
        flushList();
        para.push(line.trim());
      }
    }
    flush();
  };

  let pending: { text: string }[] = [];
  for (const r of rows) {
    if ("fence" in r) {
      textRows(pending);
      pending = [];
      const body = r.body.join("\n").replace(/\s+$/, "");
      if (r.fence === "mermaid") blocks.push(...mermaidBlocks(body));
      else blocks.push({ type: "code", text: body });
    } else pending.push(r);
  }
  textRows(pending);
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
  const withTitle = body
    .replace(/^#\s*\{\{\s*\$frontmatter\.title\s*\}\}.*$/m, "") // the page's own h1 is rendered by the site
    .replace(/\{\{\s*\$frontmatter\.title\s*\}\}/g, title);
  const parts = normalizeTables(withTitle.replace(/<!--[\s\S]*?-->/g, "")).split(/(<table\b[\s\S]*?<\/table>)/i);
  for (const part of parts) {
    if (/^<table\b/i.test(part)) blocks.push(tableBlock(part));
    else blocks.push(...textBlocks(part));
  }
  // the site prints the page title itself; a first heading that only repeats it is noise
  const first = blocks[0];
  if (first?.type === "h" && first.text.map((r) => r.text).join("") === title) blocks.shift();
  return { id, kind: kindOf(id), title, tags, blocks };
}
