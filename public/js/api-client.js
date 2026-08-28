const API_BASE_URL = "https://clickbyter-api.ronmailx.workers.dev";

export class ApiError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export async function decodeArticle(url) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/decode`, {
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
