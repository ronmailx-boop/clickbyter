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

    if (request.method === "OPTIONS") {
      return handleOptions(env);
    }

    if (pathname === "/api/decode" && request.method === "POST") {
      return handleDecode(request, env);
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(env) });
  },
};

async function handleDecode(request: Request, env: Env): Promise<Response> {
  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "INVALID_REQUEST" }, env, 400);
  }

  if (typeof body.url !== "string" || body.url.trim().length === 0) {
    return jsonResponse({ error: "INVALID_REQUEST" }, env, 400);
  }
  const sourceUrl = body.url.trim();

  let article;
  try {
    article = await extractArticle(sourceUrl);
  } catch (err) {
    if (err instanceof FetchFailedError) {
      return jsonResponse({ error: "FETCH_FAILED" }, env, 200);
    }
    if (err instanceof ExtractionFailedError) {
      return jsonResponse({ error: "EXTRACTION_FAILED" }, env, 200);
    }
    return jsonResponse(
      { error: "UNKNOWN_ERROR", detail: err instanceof Error ? err.message : String(err) },
      env,
      200
    );
  }

  if (!env.GROQ_API_KEY) {
    return jsonResponse({ error: "SERVER_MISCONFIGURED" }, env, 200);
  }

  try {
    const answer = await decodeAnswer(article.title, article.text, env.GROQ_API_KEY);
    return jsonResponse(
      {
        answer,
        sourceUrl,
        sourceTitle: article.title,
        // TODO: temporary diagnostics to check extraction quality on
        // real-world sites - remove once verified.
        debugMethod: article.method,
        debugTextLength: article.text.length,
      },
      env,
      200
    );
  } catch (err) {
    if (err instanceof RateLimitedError) {
      return jsonResponse({ error: "RATE_LIMITED" }, env, 200);
    }
    if (err instanceof LlmTimeoutError) {
      return jsonResponse({ error: "LLM_TIMEOUT" }, env, 200);
    }
    if (err instanceof ServerMisconfiguredError) {
      return jsonResponse({ error: "SERVER_MISCONFIGURED" }, env, 200);
    }
    return jsonResponse(
      { error: "UNKNOWN_ERROR", detail: err instanceof Error ? err.message : String(err) },
      env,
      200
    );
  }
}
