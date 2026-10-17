import { useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "section"; section: string }
  | { page: "wiki"; id: string }
  | { page: "search"; q: string };

const dec = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  const [head, ...rest] = path.split("/");
  const tail = rest.join("/");
  if (head === "s" && tail) return { page: "section", section: dec(tail) };
  if (head === "w" && tail) return { page: "wiki", id: dec(tail) };
  if (head === "search") return { page: "search", q: dec(tail) };
  return { page: "home" };
}

const enc = (id: string) => id.split("/").map(encodeURIComponent).join("/");

export const sectionHref = (section: string) => `#/s/${encodeURIComponent(section)}`;
export const wikiHref = (id: string) => `#/w/${enc(id)}`;
export const searchHref = (q: string) => `#/search/${encodeURIComponent(q)}`;

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
