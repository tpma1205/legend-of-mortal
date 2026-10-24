import { buildWikiIndex, type WikiIndex } from "./wikiIndex";
import type { WikiDataset } from "./wiki";

const loaders = import.meta.glob<WikiDataset>(["../../data/wiki/*.json", "!../../data/wiki/_*.json"], { import: "default" });

/** Loads every converted wiki dataset (data/wiki/*.json) on demand. */
export async function loadWiki(): Promise<WikiIndex> {
  // an extglob like `!(_)*.json` matches in dev but silently matches nothing in the production build
  if (Object.keys(loaders).length === 0) throw new Error("no wiki datasets were bundled (check the glob in wikiData.ts)");
  const datasets = await Promise.all(Object.values(loaders).map((load) => load()));
  return buildWikiIndex(datasets);
}
