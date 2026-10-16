import { useEffect, useState } from "react";

export type Route = { page: "event"; id: string } | { page: "endings"; id?: string } | { page: "home" };

export function parseHash(hash: string): Route {
  const [, page, id] = hash.replace(/^#/, "").split("/");
  if (page === "event" && id) return { page: "event", id: decodeURIComponent(id) };
  if (page === "endings") return { page: "endings", id: id ? decodeURIComponent(id) : undefined };
  return { page: "home" };
}

export const eventHref = (id: string) => `#/event/${encodeURIComponent(id)}`;
export const endingHref = (id?: string) => (id ? `#/endings/${encodeURIComponent(id)}` : "#/endings");

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function useStoredBool(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s === null ? initial : s === "1";
    } catch {
      return initial;
    }
  });
  return [
    v,
    (next) => {
      setV(next);
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // storage unavailable: the setting just won't persist
      }
    },
  ];
}
