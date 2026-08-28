const URL_PATTERN = /https?:\/\/[^\s"'<>]+/i;

function firstUrlIn(text) {
  if (!text) return null;
  const match = text.match(URL_PATTERN);
  if (!match) return null;
  // Trim common trailing punctuation that isn't part of the URL itself.
  return match[0].replace(/[)\].,!?]+$/, "");
}

/**
 * Web Share Target payloads don't reliably populate `url` - many apps
 * (notably Facebook) only fill `text`, sometimes with extra sentence text
 * around the link. Check each field in turn and extract the first URL found.
 */
export function extractSharedUrl({ url, text, title }) {
  return firstUrlIn(url) || firstUrlIn(text) || firstUrlIn(title) || null;
}
