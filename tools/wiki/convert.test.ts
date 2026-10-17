import { describe, expect, it } from "vitest";
import { convertPage, kindOf } from "./convert";

const page = (body: string, title = "測試") => `---\ntitle: ${title}\ntags:\n    - 武功\n    - 秘笈\n---\n\n# {{ $frontmatter.title }}\n\n${body}`;

describe("convertPage", () => {
  it("reads title, tags and drops the title heading and images", () => {
    const p = convertPage("system/books/book_1", page('<img src="/a.webp">\n\n內文一行。', "金剛腿"));
    expect(p.title).toBe("金剛腿");
    expect(p.tags).toEqual(["武功", "秘笈"]);
    expect(p.kind).toBe("book");
    expect(p.blocks).toEqual([{ type: "p", text: [{ text: "內文一行。" }] }]);
  });

  it("turns wiki links into references", () => {
    const p = convertPage("event/ends/end-1", page("見[[李富貴|四師兄]]與[[唐惟元]]，詳見[武林盟對策](/event/simple/3-12-1-武林盟對策)。"));
    expect(p.blocks[0]).toEqual({
      type: "p",
      text: [
        { text: "見" },
        { text: "四師兄", to: "@李富貴" },
        { text: "與" },
        { text: "唐惟元", to: "@唐惟元" },
        { text: "，詳見" },
        { text: "武林盟對策", to: "event/simple/3-12-1-武林盟對策" },
        { text: "。" },
      ],
    });
  });

  it("splits lines on <br> and keeps hover notes", () => {
    const p = convertPage("event/simple/1-04-1-x", page('<span title="道德+1">「好言相勸」</span><br>下一行'));
    expect(p.blocks).toEqual([
      { type: "p", text: [{ text: "「好言相勸」", note: "道德+1" }] },
      { type: "p", text: [{ text: "下一行" }] },
    ]);
  });

  it("parses html tables into rows of cells of lines", () => {
    const body = "<table><tr><td>等級</td><td>效果</td></tr><tr><td>LV1</td><td>體力1<br>輕功1</td></tr></table>";
    const p = convertPage("system/books/book_1", page(body));
    expect(p.blocks).toEqual([
      {
        type: "table",
        rows: [
          [[[{ text: "等級" }]], [[{ text: "效果" }]]],
          [[[{ text: "LV1" }]], [[{ text: "體力1" }], [{ text: "輕功1" }]]],
        ],
      },
    ]);
  });

  it("parses headings and nested ordered/bullet lists", () => {
    const p = convertPage("event/badends/badend-1", page("## 條件與流程\n\n1. 第一步\n2. 第二步\n   + 子項"));
    expect(p.blocks[0]).toEqual({ type: "h", level: 2, text: [{ text: "條件與流程" }] });
    expect(p.blocks[1]).toEqual({
      type: "list",
      ordered: true,
      items: [
        { depth: 0, no: 1, text: [{ text: "第一步" }] },
        { depth: 0, no: 2, text: [{ text: "第二步" }] },
        { depth: 1, text: [{ text: "子項" }] },
      ],
    });
  });

  it("drops vitepress container markers and blockquote arrows", () => {
    const p = convertPage("event/ends/end-1", page("::: warning包含攻略內容:::\n\n::: details\n- 項目\n:::\n\n> 引言"));
    expect(p.blocks).toEqual([
      { type: "p", text: [{ text: "包含攻略內容" }] },
      { type: "list", ordered: false, items: [{ depth: 0, text: [{ text: "項目" }] }] },
      { type: "p", text: [{ text: "引言" }] },
    ]);
  });

  it("reads the wiki's vue table components as tables", () => {
    const b = convertPage("event/achievements/index", page('<BTable>\n<tr><td :unsortable="true">編號</td><td>成就</td></tr>\n</BTable>\n\n<ChTable><ChTr><ChTd isTitle=true>性別</ChTd><ChTd>女</ChTd></ChTr></ChTable>'));
    expect(b.blocks).toEqual([
      { type: "table", rows: [[[[{ text: "編號" }]], [[{ text: "成就" }]]]] },
      { type: "table", rows: [[[[{ text: "性別" }]], [[{ text: "女" }]]]] },
    ]);
  });

  it("expands rowspan and colspan so every row has the same columns", () => {
    const body = '<table><tr><td rowspan="2">甲</td><td>乙</td></tr><tr><td>丙</td></tr><tr><td colspan="2">標題</td></tr></table>';
    const p = convertPage("system/develop-list", page(body));
    expect(p.blocks).toEqual([
      {
        type: "table",
        rows: [
          [[[{ text: "甲" }]], [[{ text: "乙" }]]],
          [[[{ text: "甲" }]], [[{ text: "丙" }]]],
          [[[{ text: "標題" }]], []],
        ],
      },
    ]);
  });

  it("treats a source newline inside a table cell as a soft wrap, like the wiki's browser rendering", () => {
    const p = convertPage("event/badends/index", page("<table><tr><td>第一行\n第二行<br>第三行</td></tr></table>"));
    expect(p.blocks).toEqual([{ type: "table", rows: [[[[{ text: "第一行第二行" }], [{ text: "第三行" }]]]] }]);
  });

  it("fills in the vue title placeholder wherever the page uses it", () => {
    const p = convertPage("other/guide/mechanism/x", page("內文\n\n## {{ $frontmatter.title }}", "關於心上人"));
    expect(p.blocks[1]).toEqual({ type: "h", level: 2, text: [{ text: "關於心上人" }] });
    expect(p.blocks).toHaveLength(2);
  });

  it("drops a first heading that is just the title placeholder", () => {
    const p = convertPage("other/guide/mechanism/x", page("## {{ $frontmatter.title }}\n\n內文", "關於心上人"));
    expect(p.blocks).toEqual([{ type: "p", text: [{ text: "內文" }] }]);
  });

  it("also reads the lowercase <Btable> spelling", () => {
    const b = convertPage("event/badends/index", page("<Btable>\n<tr><td>編號</td></tr>\n</Btable>"));
    expect(b.blocks).toEqual([{ type: "table", rows: [[[[{ text: "編號" }]]]] }]);
  });

  it("drops footnote markers and prints footnote definitions as notes", () => {
    const p = convertPage("people/dream-sweetheart", page("- 順序如下。[^1]\n\n[^1]: 專訪[^2]: 問答集"));
    expect(p.blocks).toEqual([
      { type: "list", ordered: false, items: [{ depth: 0, text: [{ text: "順序如下。" }] }] },
      { type: "p", text: [{ text: "註1：專訪" }] },
      { type: "p", text: [{ text: "註2：問答集" }] },
    ]);
  });

  it("reads ~~strike~~ and ||spoiler|| marks, keeping links inside them", () => {
    const p = convertPage("people/characters/x", page("他是~~渣男~~，關係：||[[唐錚]] (哥哥)||。"));
    expect(p.blocks).toEqual([
      {
        type: "p",
        text: [
          { text: "他是" },
          { text: "渣男", strike: true },
          { text: "，關係：" },
          { text: "唐錚", to: "@唐錚", spoiler: true },
          { text: " (哥哥)", spoiler: true },
          { text: "。" },
        ],
      },
    ]);
  });

  it("keeps links that sit inside a hover note, and accepts an empty alias", () => {
    const p = convertPage("event/simple/x", page('<span title="需晁和">接[失魂醒轉](/event/simple/3-11-1-失魂醒轉#夢中仙人)</span>，見[[溫夫人|]]。'));
    expect(p.blocks).toEqual([
      {
        type: "p",
        text: [
          { text: "接", note: "需晁和" },
          { text: "失魂醒轉", to: "event/simple/3-11-1-失魂醒轉", note: "需晁和" },
          { text: "，見" },
          { text: "溫夫人", to: "@溫夫人" },
          { text: "。" },
        ],
      },
    ]);
  });

  it("turns a horizontal rule into an hr block", () => {
    const p = convertPage("event/badends/x", page("上文\n\n---\n\n下文"));
    expect(p.blocks.map((b) => b.type)).toEqual(["p", "hr", "p"]);
  });

  it("keeps a fenced code block as code", () => {
    const p = convertPage("other/x", page("說明\n\n```\nline 1\n  line 2\n```\n\n後面"));
    expect(p.blocks).toEqual([
      { type: "p", text: [{ text: "說明" }] },
      { type: "code", text: "line 1\n  line 2" },
      { type: "p", text: [{ text: "後面" }] },
    ]);
  });

  it("reads a markdown pipe table, but not a ||spoiler|| line", () => {
    const p = convertPage("event/detailed_description/x", page("| 甲 | 乙 |\n| --- | --- |\n| 1 | 2 |\n\n||隱藏||"));
    expect(p.blocks[0]).toEqual({
      type: "table",
      rows: [
        [[[{ text: "甲" }]], [[{ text: "乙" }]]],
        [[[{ text: "1" }]], [[{ text: "2" }]]],
      ],
    });
    expect(p.blocks[1]).toEqual({ type: "p", text: [{ text: "隱藏", spoiler: true }] });
  });

  it("does not split a pipe table cell on the pipe of a [[name|alias]] link", () => {
    const p = convertPage("event/detailed_description/x", page("| 條件 | 結果 |\n| --- | --- |\n| [[甲|別名]] | 成功 |"));
    expect(p.blocks[0]).toEqual({
      type: "table",
      rows: [
        [[[{ text: "條件" }]], [[{ text: "結果" }]]],
        [[[{ text: "別名", to: "@甲" }]], [[{ text: "成功" }]]],
      ],
    });
  });

  it("drops a leading heading that only repeats the page title", () => {
    const p = convertPage("system/forge-roadmap", page("## 路線圖\n\n內文", "路線圖"));
    expect(p.blocks).toEqual([{ type: "p", text: [{ text: "內文" }] }]);
  });

  it("turns a mermaid upgrade chart into an indented list plus its refund note", () => {
    const chart = [
      "```mermaid",
      "graph TB",
      "  subgraph 鍛冶場",
      '    A[唐門小劍<img src="/a.webp"><br>需要：無]',
      '    B[唐門菁英小劍<img src="/b.webp"><br>需要：裝備等級5<br>門派規模2]',
      "    C[切魚刀<br>需要：裝備等級5]",
      "  end",
      "  %% 升級箭頭",
      "  A --> B",
      "  A --> C",
      "  B -.->|<font color='#00FF00'>退還消耗90%</font>| A",
      "  linkStyle 0 stroke:#FFD700",
      "  style A stroke:#FFF",
      "```",
    ].join("\n");
    const p = convertPage("system/forge-roadmap", page(chart));
    expect(p.blocks).toEqual([
      {
        type: "list",
        ordered: false,
        items: [
          { depth: 0, text: [{ text: "唐門小劍（需要：無）" }] },
          { depth: 1, text: [{ text: "唐門菁英小劍（需要：裝備等級5，門派規模2）" }] },
          { depth: 1, text: [{ text: "切魚刀（需要：裝備等級5）" }] },
        ],
      },
      { type: "p", text: [{ text: "退還：退還消耗90%" }] },
    ]);
  });

  it("keeps external links, including escaped brackets in their text", () => {
    const p = convertPage("people/characters/x", page("註：PTT－[\\[活俠\\] 小知識](https://www.ptt.cc/bbs/a.html)"));
    expect(p.blocks).toEqual([
      { type: "p", text: [{ text: "註：PTT－" }, { text: "[活俠] 小知識", href: "https://www.ptt.cc/bbs/a.html" }] },
    ]);
  });

  it("does not split a [[link]] whose name runs across a <br>", () => {
    const body = "<table><tr><td>[[眾人的決策#其他門派<br>飛石幫支援]]<br>下一行</td></tr></table>";
    const p = convertPage("event/detailed_description/x", page(body));
    expect(p.blocks).toEqual([
      { type: "table", rows: [[[[{ text: "眾人的決策#其他門派 飛石幫支援", to: "@眾人的決策" }], [{ text: "下一行" }]]]] },
    ]);
  });

  it("keeps the text of vue wrapper components but not their markup", () => {
    const p = convertPage("event/ends/end-1", page('<EndBackground no=25 title="退隱江湖">\n你退隱之後。<br>\n波瀾。\n</EndBackground>'));
    expect(p.blocks.map((b) => b.type)).toEqual(["p", "p"]);
  });
});

describe("kindOf", () => {
  it("maps wiki paths to kinds", () => {
    expect(kindOf("people/characters/girl2")).toBe("character");
    expect(kindOf("system/books/book_4001")).toBe("book");
    expect(kindOf("event/ends/end-25")).toBe("ending");
    expect(kindOf("event/badends/badend-1")).toBe("badend");
    expect(kindOf("event/achievements/index")).toBe("achievement");
    expect(kindOf("event/simple/1-04-1-偷懶怪")).toBe("event");
    expect(kindOf("system/skill")).toBe("skill");
    expect(kindOf("system/items/index")).toBe("item");
    expect(kindOf("other/qna/x")).toBe("other");
    expect(kindOf("other/guide/mechanism/dream-sweetheart")).toBe("mechanism");
    expect(kindOf("system/develop-list")).toBe("forge");
    expect(kindOf("system/forge-roadmap")).toBe("forge");
  });
});
