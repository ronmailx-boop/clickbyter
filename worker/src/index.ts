import { extractArticle, FetchFailedError, ExtractionFailedError } from "./extract";
import {
  decodeAnswer,
  RateLimitedError,
  LlmTimeoutError,
  ServerMisconfiguredError,
} from "./groq";
import { corsHeaders, handleOptions, jsonResponse, Env } from "./cors";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return handleOptions(env, origin);
    }

    if (pathname === "/api/decode" && request.method === "POST") {
      return handleDecode(request, env, origin);
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(env, origin) });
  },
};

async function handleDecode(request: Request, env: Env, origin: string | null): Promise<Response> {
  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "INVALID_REQUEST" }, env, origin, 400);
  }

  if (typeof body.url !== "string" || body.url.trim().length === 0) {
    return jsonResponse({ error: "INVALID_REQUEST" }, env, origin, 400);
  }
  const inputUrl = body.url.trim();

  let article;
  try {
    article = await extractArticle(inputUrl);
  } catch (err) {
    if (err instanceof FetchFailedError) {
      return jsonResponse({ error: "FETCH_FAILED" }, env, origin, 200);
    }
    if (err instanceof ExtractionFailedError) {
      return jsonResponse({ error: "EXTRACTION_FAILED" }, env, origin, 200);
    }
    return jsonResponse(
      { error: "UNKNOWN_ERROR", detail: err instanceof Error ? err.message : String(err) },
      env,
      origin,
      200
    );
  }

  if (!env.GROQ_API_KEY) {
    return jsonResponse({ error: "SERVER_MISCONFIGURED" }, env, origin, 200);
  }

  try {
    const answer = await decodeAnswer(article.title, article.text, env.GROQ_API_KEY);
    return jsonResponse(
      // article.finalUrl is the URL after following any redirects (e.g. a
      // bit.ly link resolves to the real article here) - point the user at
      // the actual article, not back through the shortener.
      { answer, sourceUrl: article.finalUrl, sourceTitle: article.title },
      env,
      origin,
      200
    );
  } catch (err) {
    if (err instanceof RateLimitedError) {
      return jsonResponse({ error: "RATE_LIMITED" }, env, origin, 200);
    }
    if (err instanceof LlmTimeoutError) {
      return jsonResponse({ error: "LLM_TIMEOUT" }, env, origin, 200);
    }
    if (err instanceof ServerMisconfiguredError) {
      return jsonResponse({ error: "SERVER_MISCONFIGURED" }, env, origin, 200);
    }
    return jsonResponse(
      { error: "UNKNOWN_ERROR", detail: err instanceof Error ? err.message : String(err) },
      env,
      origin,
      200
    );
  }
}
