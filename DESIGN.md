---
name: 活俠傳攻略
description: A scroll-desk reference for the game 活俠傳, built on shuimo-ui. Brushwork in the margins, calm paper under the text.
colors:
  rice-paper: "#fcfaf0"
  ink: "#2b333e"
  ink-strong: "#0f1423"
  ink-muted: "#61676c"
  paper-wash: "#eeece4"
  hairline: "#cecec9"
  seal-cinnabar: "#c1272d"
  link-oxblood: "#861717"
  night-paper: "#151d29"
  night-ink: "#e6e2d8"
  night-ink-muted: "#b0afab"
  night-wash: "#242b35"
  night-hairline: "#434850"
  night-seal: "#d0323a"
  night-link: "#e58e93"
typography:
  display:
    fontFamily: "'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 900
    lineHeight: 1.3
    letterSpacing: "normal"
  brand:
    fontFamily: "'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.8
    letterSpacing: "0.12em"
  title:
    fontFamily: "'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.8
  body:
    fontFamily: "'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
  table:
    fontFamily: "'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.8
    letterSpacing: "0.1em"
  footnote:
    fontFamily: "'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  hairline: "2px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "3rem"
  sidebar-width: "21rem"
  reading-column: "56rem"
components:
  nav-link-current:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "0.25rem 0"
  sidebar-link:
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "0.3rem 0.6rem"
  sidebar-link-hover:
    backgroundColor: "{colors.paper-wash}"
  sidebar-link-current:
    backgroundColor: "{colors.seal-cinnabar}"
    textColor: "{colors.rice-paper}"
  sidebar-link-missing:
    textColor: "{colors.ink-muted}"
  table-header:
    backgroundColor: "{colors.paper-wash}"
    textColor: "{colors.ink}"
    typography: "{typography.table}"
    padding: "0.35rem 0.6rem"
  table-cell:
    textColor: "{colors.ink}"
    typography: "{typography.table}"
    padding: "0.35rem 0.6rem"
  tag:
    textColor: "{colors.link-oxblood}"
    rounded: "{rounded.hairline}"
    typography: "{typography.footnote}"
    padding: "0 0.4rem"
  footer:
    backgroundColor: "{colors.rice-paper}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.footnote}"
    padding: "0.5rem 1.5rem 0.75rem"
---

# Design System: 活俠傳攻略

## Overview

**Creative North Star: "The Scroll Desk"**

A reference opened on a second monitor mid-run, laid out like a desk with a scroll on it. Texture and brushwork live in the margins, edges and seals; the reading text stays on calm paper. The visual vocabulary is the pinned library @shuimo-design/react (beta): a raw rice-paper ground, brush-drawn rules, one cinnabar seal. The project stylesheet only lays out and re-expresses the library's `--m-*` tokens; it adds no palette of its own.

Density is that of a lookup tool. Entries are found in seconds through a folded sidebar, a section nav or search, and the page tells the reader where they are with a breadcrumb and a brush-underlined section name. Ink effects are reserved for borders, titles, dividers and stamps. Tables and lists are never inked; lookup comes first.

Two themes share one structure: 宣紙 (light rice paper, ink text) and 墨夜 (dark, deep ink ground, pale ink text, brighter cinnabar). The library's taiji toggle switches them through `data-theme="dark"`.

**Key Characteristics:**
- Rice-paper ground over the whole viewport, with the main column as the only scroller.
- Brush rules (MBorder, MDivider) separate regions instead of boxes and cards.
- One red voice: the seal. Everything else is ink on paper.
- Noto Serif TC for everything, with weight 900 reserved for the title and brand.
- Plain thin-ruled tables.
- One authored motion: the page settles in and the title rule is drawn left to right.

## Colors

Ink on warm rice paper with a single cinnabar seal; the dark theme inverts to pale ink on deep blue-black paper. Values below are the library's resolved tokens; the project re-expresses them as local tokens and mixes its neutrals from them.

### Primary
- **Seal Cinnabar** (#c1272d; dark #d0323a): `--m-seal`. The brand stamp, the current-page mark in the sidebar (fill, with white text), text selection, the focus ring, the reading-progress stroke. Rare by design.
- **Oxblood Link** (#861717, `--m-accent`; dark #e58e93, a 55% seal-to-white mix): link text and hover color, and the bordered tag text. A deeper red than the seal, kept for text so links stay legible on paper.

### Neutral
- **Rice Paper** (#fcfaf0; dark Night Paper #151d29): `--m-paper-rgb`, the body ground and the footer base.
- **Ink** (#2b333e; dark #e6e2d8): body text, nav links. Strong ink (#0f1423; dark #ffffff) for the brand and h1.
- **Muted Ink** (#61676c; dark #b0afab): `--muted`, 74% ink over paper. Meta lines, month labels, notes, the footer, missing entries.
- **Paper Wash** (#eeece4; dark #242b35): `--wash`, 7% ink over paper. Sidebar hover, table header, input fill, expanded note.
- **Hairline** (#cecec9; dark #434850): `--line`, 22% ink over paper. Table borders, result and entry separators, footer top rule.

### Named Rules
**The One Seal Rule.** The seal red is the only chromatic color. It marks place (current page, brand stamp) and focus, never decoration or status.

**The Derived Neutrals Rule.** Muted, wash and line are always mixed from `--m-fg` and the paper token, never hard-coded, so both themes follow without a second palette.

## Typography

**Display, Body and Label Font:** Noto Serif TC (Google Fonts, with Songti TC, PMingLiU, serif)

**Character:** One serif voice, a printed-book register. Hierarchy comes from weight (400, 600, 900) and size, not from a second family. The seal font is handled by the library's stamp.

### Hierarchy
- **Display** (900, clamp(1.75rem, 4vw, 2.5rem), 1.3): page h1, balanced wrap, strong ink.
- **Brand** (900, 1.5rem, letter-spacing 0.12em; 1.25rem on phones): header name beside the 活俠 stamp.
- **Title** (600, 1.0625rem): wiki h3/h4. Section h2 is a brush MDivider with left-aligned text, not a styled heading.
- **Body** (400, 16px, 1.8): reading text in a column of at most 56rem.
- **Table** (400, 0.9375rem): table text; header cells 600.
- **Label** (600, 0.875rem, letter-spacing 0.1em): month and group headings in the timeline sidebar, in muted ink.
- **Footnote** (400, 0.8125rem, 1.6): footer, in muted ink.

### Named Rules
**The Tabular Count Rule.** Numbers that index (list numbers, months) use `tabular-nums`.

## Layout

A full-viewport grid: header row, a 21rem sidebar column beside a flexible main column, and a footer row. The shell fills 100% height and only the sidebar and `#main` scroll. Pages without a sidebar collapse to one column. The reading column holds at 56rem and takes `clamp(1.25rem, 5vw, 4rem)` side padding. Spacing is rem-based on a loose 0.25 / 0.5 / 1 / 1.5 / 3 rhythm; headings sit 2rem (h2) and 1.5rem (h3) above their content.

The home page lists entries in an auto-fit grid (min 16rem, 2rem column gap), each separated by a top hairline, with no cards.

Under 800px: the sidebar moves into a left MDrawer (86% wide, title 目錄) opened by a text button in the header; the header shrinks (brand 1.25rem, search 7.5rem) and the section nav becomes one horizontally scrolling row with hidden scrollbar; main padding drops to 1rem.

## Elevation & Depth

Flat. There are no box shadows in the project. Depth comes from the paper ground, brush edges (a 10px brush rule at the header base, an 8px brush edge on the sidebar's right, a 10px rule under each title), and tonal washes. The footer sits on 92% paper over a hairline.

### Named Rules
**The Brush Is The Border Rule.** Regions are divided by MBorder and MDivider strokes (thickness 3), each with its own seed so repeated strokes differ. Do not box regions with CSS borders; the table's hairline grid is the only ruled structure.

## Shapes

Almost square. The only radius in the project is 2px (sidebar links, tags), matching the library's `--m-radius`. Silhouette comes from the hand-drawn brush edges and the square seal stamp, not from rounded corners or pills.

## Components

Most components are library parts; the project only places and tints them.

### Navigation
- **Section nav:** plain links in ink; hover turns oxblood; the current one is weight 600 and wrapped in a brush underline (MBorder, bottom, stroke 3).
- **Sidebar:** folded groups (MCollapse) titled `name（count）`; links with 0.3rem 0.6rem padding, wash on hover, seal fill with white text for the current page, muted ink for missing entries. A filter input appears when a section has more than four pages. Timeline rows use a 2.4rem month column.
- **Breadcrumb:** MBreadcrumb above every title, 0.9375rem.

### Header
- MStamp 活俠 (40px; 30px on phones) with the brand name, section nav, search input (17rem; 11rem and 7.5rem on narrower screens), and the MDarkMode taiji toggle.

### Inputs
- MInput with paper-wash fill replacing the library's translucent paper; placeholders in muted ink at full opacity; clearable. Focus ring is 2px seal outline, 2px offset, site-wide.

### Tables
- Collapsed borders in hairline, 0.35rem 0.6rem padding, header on paper wash with a 2px ink bottom rule and no wrapping. Wrapper scrolls horizontally. Never inked.

### Notes and inline
- Annotated text: dotted underline, expands to a wash highlight with muted smaller note text. Emoji glyphs in wiki text are desaturated (grayscale, 80% opacity).

### Footer colophon
- MSealColophon (stamp 36px, text 資料整理自, author, date, right-aligned) in muted 0.8125rem text over a hairline. The seal hangs past the text, so the first child keeps a 3rem right margin and the date stays on one line.

### Utility parts
- MReadingStroke (3px progress stroke on `#main`), MBackTop, MDrawer, MEmpty, MLoading, MCard as supplied by the library.

### Motion
- Page article and home settle in over 0.45s (6px rise, fade); the title rule is drawn with a left-to-right clip over 0.7s after 0.1s; both ease with cubic-bezier(0.16, 1, 0.3, 1). Only under `prefers-reduced-motion: no-preference`.

## Do's and Don'ts

### Do:
- **Do** express new colors as mixes of `--m-fg` and the paper token, or as library `--m-*` tokens, so light and dark both follow.
- **Do** keep seal red for place and focus: current marks, the brand stamp, selection and the focus ring.
- **Do** separate regions with MBorder and MDivider strokes, and give each a distinct `seed`.
- **Do** keep reading text on plain paper in Noto Serif TC at 1.8 line height inside the 56rem column.
- **Do** keep tables plain: hairline grid, wash header, no ink effects.
- **Do** gate every animation behind `prefers-reduced-motion: no-preference`.

### Don't:
- **Don't** put ink or brush effects on dense tables or lists.
- **Don't** build a SaaS sidebar-and-cards dashboard: no card grids, no shadows, no pills.
- **Don't** add a second accent hue or use red decoratively.
- **Don't** hard-code light-only hex values in project CSS; they break 墨夜.
- **Don't** show far-mountain imagery outside the home page.
