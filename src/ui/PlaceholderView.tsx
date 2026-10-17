import { MBorder, MBreadcrumb, MBreadcrumbItem, MEmpty } from "@shuimo-design/react";
import type { EndingEntry } from "../guide/endingList";
import { sectionHref, wikiHref } from "./route";

/** one wording for every entry the wiki lists but has not written up */
export const NO_DETAIL = "目前尚無詳細資料：wiki 尚未收錄，或目前版本尚無法達成。";

export function PlaceholderView({ entry, noun, overviewId }: { entry: EndingEntry; noun: string; overviewId: string }) {
  return (
    <article className="event wiki-page">
      <MBreadcrumb className="crumbs">
        <MBreadcrumbItem href={sectionHref("endings")}>結局系列</MBreadcrumbItem>
        <MBreadcrumbItem>{noun}</MBreadcrumbItem>
        <MBreadcrumbItem>{entry.label}</MBreadcrumbItem>
      </MBreadcrumb>
      <header>
        <h1>{entry.label}</h1>
        <MBorder bottom border={false} seed={2} strokeWidth={4} flyingWhite={0.2} className="title-rule" />
      </header>
      <MEmpty description={NO_DETAIL} />
      <p className="meta">
        <a href={wikiHref(overviewId)}>{noun}總表</a>
      </p>
    </article>
  );
}
