import { extractSharedUrl } from "./url-extract.js";

/**
 * Reads the query params a Web Share Target navigation lands with
 * (?title=&text=&url=) and returns the shared article URL, if any.
 */
export function getSharedUrlFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return extractSharedUrl({
    url: params.get("url"),
    text: params.get("text"),
    title: params.get("title"),
  });
}
