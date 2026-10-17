import { useEffect, useState } from "react";

/**
 * Which folded groups of a sidebar are open. The group holding the current page opens itself whenever
 * the page changes; while a filter is typed every group stays open so matches are visible.
 */
export function useOpenGroups(activeGroup: string | undefined, forceAll: boolean, all: string[], fallback?: string): [string[], (v: string[]) => void] {
  const [open, setOpen] = useState<string[]>(() => [activeGroup ?? (fallback && all.includes(fallback) ? fallback : all[0])].filter((x): x is string => !!x));
  useEffect(() => {
    if (activeGroup) setOpen((cur) => (cur.includes(activeGroup) ? cur : [...cur, activeGroup]));
  }, [activeGroup]);
  return [forceAll ? all : open, setOpen];
}
