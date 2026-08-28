import { decodeArticle, ApiError } from "./api-client.js";
import { getHistory, addHistoryItem, clearHistory } from "./history-store.js";
import { getSharedUrlFromLocation } from "./share-target.js";

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
  RATE_LIMITED: "יותר מדי בקשות כרגע. נסו שוב בעוד כמה דקות.",
  LLM_TIMEOUT: "הפענוח ארך זמן רב מדי. נסו שוב.",
  SERVER_MISCONFIGURED: "שירות הפענוח אינו זמין כרגע.",
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
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("history-list");
const clearHistoryButton = document.getElementById("clear-history-button");

function setStatus(message, tone = "") {
  statusRegion.textContent = message;
  statusRegion.dataset.tone = tone;
}

function showAnswer(sourceUrl, answer) {
  resultAnswer.textContent = answer;
  resultSourceLink.href = sourceUrl;
  resultSection.hidden = false;
}

function showFailure(sourceUrl) {
  resultAnswer.textContent = "";
  resultSourceLink.href = sourceUrl;
  resultSection.hidden = false;
}

function renderHistory() {
  const items = getHistory();
  historyList.textContent = "";
  historySection.hidden = items.length === 0;

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "history-item";

    const answerP = document.createElement("p");
    answerP.className = "history-item-answer";
    answerP.textContent = item.answer;
    li.appendChild(answerP);

    const link = document.createElement("a");
    link.className = "source-link";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.sourceTitle || "לקריאת הכתבה המקורית";
    li.appendChild(link);

    historyList.appendChild(li);
  }
}

let isProcessing = false;

async function processUrl(url) {
  if (isProcessing) return;
  isProcessing = true;
  resultSection.hidden = true;
  submitButton.setAttribute("aria-busy", "true");
  setStatus("מפענח את הכתבה...");

  try {
    const { answer, sourceUrl, sourceTitle } = await decodeArticle(url);
    setStatus("");
    showAnswer(sourceUrl, answer);
    addHistoryItem({ url: sourceUrl, sourceTitle, answer });
    renderHistory();
  } catch (err) {
    const code = err instanceof ApiError ? err.code : "UNKNOWN_ERROR";
    setStatus(ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR, "error");
    showFailure(url);
  } finally {
    submitButton.removeAttribute("aria-busy");
    isProcessing = false;
  }
}

clearHistoryButton.addEventListener("click", () => {
  clearHistory();
  renderHistory();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;
  processUrl(url);
});

renderHistory();

const sharedUrl = getSharedUrlFromLocation();
if (sharedUrl) {
  urlInput.value = sharedUrl;
  // Drop the share-target query params so a page refresh doesn't reprocess the same link.
  window.history.replaceState(null, "", window.location.pathname);
  processUrl(sharedUrl);
}
