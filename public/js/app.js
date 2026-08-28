if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Installation still works without the service worker; it only affects offline shell caching.
    });
  });
}

const form = document.getElementById("add-link-form");
const statusRegion = document.getElementById("status-region");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  statusRegion.dataset.tone = "";
  statusRegion.textContent = "פענוח כתבות יתאפשר בקרוב.";
});
