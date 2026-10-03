export interface Env {
  ALLOWED_ORIGINS: string;
  GROQ_API_KEY: string;
}

// ALLOWED_ORIGINS is comma-separated (multiple sites can call this API -
// e.g. Newsly during its move from GitHub Pages to a Cloudflare custom
// domain, both live at once). Access-Control-Allow-Origin can only ever
// echo back ONE value, so we only set it when the request's own Origin
// is in the allowlist - otherwise the browser blocks the response itself.
function allowedOrigin(env: Env, requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  const allowed = env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

export function corsHeaders(env: Env, requestOrigin: string | null): Record<string, string> {
  const origin = allowedOrigin(env, requestOrigin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function jsonResponse(
  body: unknown,
  env: Env,
  requestOrigin: string | null,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env, requestOrigin),
    },
  });
}

export function handleOptions(env: Env, requestOrigin: string | null): Response {
  return new Response(null, { status: 204, headers: corsHeaders(env, requestOrigin) });
}
