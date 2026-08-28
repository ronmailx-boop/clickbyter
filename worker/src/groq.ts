const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// Confirm this is still a currently-hosted Groq model at deploy time -
// Groq's hosted model lineup changes; see https://console.groq.com/docs/models
const GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_TIMEOUT_MS = 15000;
const MAX_ARTICLE_CHARS = 8000;

const SYSTEM_PROMPT =
  "בהינתן כותרת קליקבייט וטקסט של כתבה, החזר אך ורק את העובדה או התשובה הספציפית שהכותרת מסתירה או " +
  "מרמזת עליה, בעברית, ב-1 עד 3 משפטים קצרים. אל תסכם את הכתבה כולה ואל תוסיף הקדמות. אם אין תשובה " +
  "חד-משמעית ברורה בטקסט, כתוב במפורש: \"לא ניתן לזהות תשובה חד-משמעית בכתבה הזו.\"";

export class RateLimitedError extends Error {}
export class LlmTimeoutError extends Error {}
export class ServerMisconfiguredError extends Error {}

export async function decodeAnswer(
  title: string,
  articleText: string,
  apiKey: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 200,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `כותרת: ${title}\n\nתוכן הכתבה:\n${articleText.slice(0, MAX_ARTICLE_CHARS)}`,
          },
        ],
      }),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new LlmTimeoutError("groq_timeout");
    }
    throw new Error("groq_network_error");
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    throw new RateLimitedError("groq_rate_limited");
  }
  if (response.status === 401 || response.status === 403) {
    throw new ServerMisconfiguredError("groq_auth_failed");
  }
  if (!response.ok) {
    throw new Error(`groq_bad_status_${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("groq_empty_response");
  }
  return answer;
}
