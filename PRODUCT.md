# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, static site with hash routing, deployed to GitHub Pages (repo `tpma1205/legend-of-mortal`). No backend, no accounts. Data lives in `data/wiki/*.json`, produced by a converter in `tools/wiki/`.

## Users

Players of 《活俠傳》 (Steam) who keep the guide open on a second monitor while playing, and check what a choice leads to, what an item or 秘笈 does, or how to reach an ending. They look things up in the middle of a run, often in a hurry, and many want to avoid spoilers beyond what they ask for.

## Product Purpose

A fan-made lookup site that turns the 活俠傳 wiki into something fast to scan during play: event timeline, characters, 秘笈 and 技能, items/equipment/alchemy, 汗青書 / 生死簿 / 風雲史, 夢境心上人 and game mechanics, all cross-linked. Success is finding the entry you were looking for in seconds, with its conditions and consequences intact.

## Positioning

Not a new guide: a structured, searchable, cross-linked view of an existing community wiki, with every page tracing back to its source and showing what this site changed.

## Operating Context

Desktop only, on a second screen next to the game (phones are not designed for). Heavy reading of tables (equipment, items, endings index) and long flow lists (events). Traditional Chinese content; search accepts simplified input.

## Capabilities and Constraints

- Source is the 活俠傳 wiki (smilin.net/LoM-wiki, CC BY-NC-SA 4.0): wiki wins on conflicts; this site is non-commercial, credits the wiki on every page, and lists its own edits on the page (see `docs/adr/0001-follow-wiki-license.md`).
- Only character portraits are shown, linked straight from the wiki's server on the character's own page (never copied into this site), with credit to the game art's owner; no other game or wiki images are used.
- Terminology is fixed in `GLOSSARY.md` (汗青書 = 結局, 生死簿 = 驟死結局, 風雲史 = 成就).
- The wiki lags the game: content from the 《崆峒神威》 update (2026-10-15) is not yet in the wiki.

## Brand Commitments

Name: 活俠傳攻略 (unofficial). Visual world pinned by the user: Chinese ink-wash (水墨), built with the shuimo-ui component library (the React package `@shuimo-design/react`), installed at project level.

## Evidence on Hand

Converted wiki data in `data/wiki/` (115 characters, 89 books, 247 events, 54 汗青書 and 105 生死簿 numbers, tables for items and equipment). No screenshots, testimonials or usage data; none should be invented.

## Product Principles

1. Lookup speed beats decoration: the entry you want is never more than a search or two away.
2. Show where information comes from and what we changed.
3. Do not invent: if the wiki has no content, say so plainly.
4. Spoilers are the reader's choice; nothing reveals more than the page asked for.

## Accessibility & Inclusion

Text must stay readable at body size on both light and dark grounds; keyboard operable; no meaning carried by color alone.
