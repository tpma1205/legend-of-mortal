import type { Block, Inline, WikiPage } from "../../src/guide/wiki";

type Table = Extract<Block, { type: "table" }>;

const plain = (cell: Inline[][]) => cell.map((line) => line.map((r) => r.text).join("")).join("").trim();
const heading = (text: string): Block => ({ type: "h", level: 2, text: [{ text }] });

/**
 * The wiki keeps all 風雲史 in one table and writes no page per achievement. Split each row into its own
 * page so the sidebar can list them like 汗青書 and 生死簿, and say so on the page (CC BY-SA: list our changes).
 */
export function splitAchievements(overview: WikiPage): { overview: WikiPage; pages: WikiPage[] } {
  const table = overview.blocks.find((b): b is Table => b.type === "table");
  if (!table) return { overview, pages: [] };
  const [head, ...rows] = table.rows;
  const column = (name: string) => head.findIndex((c) => plain(c) === name);
  const [noCol, nameCol, descCol] = [column("編號"), column("成就"), column("成就描述")];
  const detailCols = ["解鎖條件", "解鎖特性", "備註"].map((name) => ({ name, at: column(name) }));
  const dir = overview.id.replace(/\/index$/, "");

  const pages: WikiPage[] = [];
  const linked = rows.map((row) => {
    const no = Number(plain(row[noCol] ?? []));
    const name = plain(row[nameCol] ?? []);
    if (!Number.isFinite(no) || !name) return row;
    const id = `${dir}/ach-${no}`;
    const blocks: Block[] = [];
    const desc = row[descCol] ?? [];
    for (const line of desc) if (plain([line])) blocks.push({ type: "p", text: line });
    for (const { name: h, at } of detailCols) {
      const lines = (row[at] ?? []).filter((line) => plain([line]));
      if (lines.length === 0) continue;
      blocks.push(heading(h), ...lines.map((text): Block => ({ type: "p", text })));
    }
    pages.push({ id, kind: "achievement", title: `風雲史${no}：${name}`, tags: [], blocks, derivedFrom: overview.id, edits: ["本站整理：wiki 把所有風雲史寫在同一張總表，本頁是本站從該表第 " + no + " 號那一列拆出的獨立頁面，文字未改動。"] });
    const cells = [...row];
    cells[nameCol] = (row[nameCol] ?? []).map((line) => line.map((r) => ({ ...r, to: r.to ?? id })));
    return cells;
  });

  const patched = overview.blocks.map((b) => (b === table ? { ...table, rows: [head, ...linked] } : b));
  return { overview: { ...overview, blocks: patched }, pages };
}
