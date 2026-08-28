import { extractArticle, FetchFailedError, ExtractionFailedError } from "./extract";
import { corsHeaders, handleOptions, jsonResponse, Env } from "./cors";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") {
      return handleOptions(env);
    }

    if (pathname === "/api/extract" && request.method === "POST") {
      return handleExtract(request, env);
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(env) });
  },
};

async function handleExtract(request: Request, env: Env): Promise<Response> {
  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "INVALID_REQUEST" }, env, 400);
  }

  if (typeof body.url !== "string" || body.url.trim().length === 0) {
    return jsonResponse({ error: "INVALID_REQUEST" }, env, 400);
  }

  try {
    const article = await extractArticle(body.url);
    return jsonResponse(article, env, 200);
  } catch (err) {
    if (err instanceof FetchFailedError) {
      return jsonResponse({ error: "FETCH_FAILED" }, env, 200);
    }
    if (err instanceof ExtractionFailedError) {
      return jsonResponse({ error: "EXTRACTION_FAILED" }, env, 200);
    }
    return jsonResponse({ error: "UNKNOWN_ERROR" }, env, 200);
  }
}
