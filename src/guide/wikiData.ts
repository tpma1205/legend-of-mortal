import { buildWikiIndex, type WikiIndex } from "./wikiIndex";
import type { WikiDataset } from "./wiki";

const loaders = import.meta.glob<WikiDataset>("../../data/wiki/!(_)*.json", { import: "default" });

/** Loads every converted wiki dataset (data/wiki/*.json) on demand. */
export async function loadWiki(): Promise<WikiIndex> {
  const datasets = await Promise.all(Object.values(loaders).map((load) => load()));
  return buildWikiIndex(datasets);
}
