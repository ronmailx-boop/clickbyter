// TODO: after the first `wrangler deploy` (see worker/README or PROJECT_STATE.md),
// replace this with the real Worker URL, e.g. "https://clickbyter-api.<subdomain>.workers.dev".
const API_BASE_URL = "http://localhost:8792";

export class ApiError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export async function extractArticle(url) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    throw new ApiError("NETWORK_ERROR");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("NETWORK_ERROR");
  }

  if (data.error) {
    throw new ApiError(data.error);
  }

  return data;
}
