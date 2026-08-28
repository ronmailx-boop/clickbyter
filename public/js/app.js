import { extractArticle, ApiError } from "./api-client.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Installation still works without the service worker; it only affects offline shell caching.
    });
  });
}

const ERROR_MESSAGES = {
  INVALID_REQUEST: "הקישור שהוזן אינו תקין.",
  FETCH_FAILED: "לא הצלחנו לגשת לכתבה. ייתכן שהקישור שגוי או שהאתר חוסם גישה אוטומטית.",
  EXTRACTION_FAILED:
    "לא הצלחנו לחלץ תוכן קריא מהכתבה (ייתכן שמדובר בתוכן מאחורי פייוול או עמוד שנטען דינמית).",
  NETWORK_ERROR: "בעיית תקשורת עם השרת. בדקו את החיבור לאינטרנט ונסו שוב.",
  UNKNOWN_ERROR: "אירעה שגיאה בלתי צפויה. נסו שוב מאוחר יותר.",
};

const form = document.getElementById("add-link-form");
const urlInput = document.getElementById("article-url");
const submitButton = form.querySelector(".primary-button");
const statusRegion = document.getElementById("status-region");
const resultSection = document.getElementById("result-section");
const resultAnswer = document.getElementById("result-answer");
const resultSourceLink = document.getElementById("result-source-link");

function setStatus(message, tone = "") {
  statusRegion.textContent = message;
  statusRegion.dataset.tone = tone;
}

function showResult(url, article) {
  resultSourceLink.href = url;
  // Temporary (Phase 2) preview of the raw extracted content, ahead of the
  // Groq-powered short-answer summary that replaces this in Phase 3.
  const preview = article.text.length > 400 ? `${article.text.slice(0, 400)}...` : article.text;
  resultAnswer.textContent = `[${article.method}] ${article.title || "(ללא כותרת)"}\n\n${preview}`;
  resultSection.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;

  resultSection.hidden = true;
  submitButton.disabled = true;
  setStatus("מפענח את הכתבה...");

  try {
    const article = await extractArticle(url);
    setStatus("");
    showResult(url, article);
  } catch (err) {
    const code = err instanceof ApiError ? err.code : "UNKNOWN_ERROR";
    setStatus(ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR, "error");
    resultSourceLink.href = url;
    resultAnswer.textContent = "";
    resultSection.hidden = false;
  } finally {
    submitButton.disabled = false;
  }
});
