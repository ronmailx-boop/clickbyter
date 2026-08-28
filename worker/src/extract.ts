import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

const FETCH_TIMEOUT_MS = 9000;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const MIN_USABLE_TEXT_LENGTH = 200;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export class FetchFailedError extends Error {}
export class ExtractionFailedError extends Error {}

function isPrivateOrLocalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "0.0.0.0" || lower === "::1") return true;
  const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local
  }
  return false;
}

export function assertSafeUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new FetchFailedError("invalid_url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchFailedError("unsupported_protocol");
  }
  if (isPrivateOrLocalHost(url.hostname)) {
    throw new FetchFailedError("blocked_host");
  }
  return url;
}

async function fetchHtml(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok || !response.body) {
      throw new FetchFailedError(`bad_status_${response.status}`);
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8").decode(buffer);
  } catch (err) {
    if (err instanceof FetchFailedError) throw err;
    throw new FetchFailedError("network_error");
  } finally {
    clearTimeout(timeout);
  }
}

export interface ExtractedArticle {
  title: string;
  text: string;
  method: "readability" | "og-description" | "raw-paragraphs";
}

function extractOgFallback(document: Document): { title: string; text: string } | null {
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
  const ogDescription =
    document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
    document.querySelector('meta[name="description"]')?.getAttribute("content");
  const title = ogTitle || document.querySelector("title")?.textContent || "";
  if (ogDescription && ogDescription.trim().length > 0) {
    return { title: title.trim(), text: ogDescription.trim() };
  }
  return null;
}

function extractRawParagraphs(document: Document): { title: string; text: string } | null {
  const title = document.querySelector("title")?.textContent?.trim() || "";
  const paragraphs = Array.from(document.querySelectorAll("p"))
    .map((p) => p.textContent?.trim() || "")
    .filter((t) => t.length > 40);
  const text = paragraphs.join("\n\n");
  if (text.length >= MIN_USABLE_TEXT_LENGTH) {
    return { title, text };
  }
  return null;
}

export async function extractArticle(rawUrl: string): Promise<ExtractedArticle> {
  const url = assertSafeUrl(rawUrl);
  const html = await fetchHtml(url);

  const { document } = parseHTML(html);

  try {
    // Readability mutates the DOM it's given; clone via re-parsing so the
    // fallback paths below still have an intact document to query.
    const { document: readabilityDoc } = parseHTML(html);
    const article = new Readability(readabilityDoc as unknown as Document, {
      // @ts-expect-error - Readability's types don't declare this option but it's supported
      url: url.toString(),
    }).parse();
    if (article?.textContent && article.textContent.trim().length >= MIN_USABLE_TEXT_LENGTH) {
      return {
        title: (article.title || "").trim(),
        text: article.textContent.trim(),
        method: "readability",
      };
    }
  } catch {
    // fall through to the OG/paragraph fallbacks below
  }

  const ogResult = extractOgFallback(document as unknown as Document);
  if (ogResult) {
    return { ...ogResult, method: "og-description" };
  }

  const rawResult = extractRawParagraphs(document as unknown as Document);
  if (rawResult) {
    return { ...rawResult, method: "raw-paragraphs" };
  }

  throw new ExtractionFailedError("no_usable_content");
}
