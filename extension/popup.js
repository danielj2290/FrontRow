// ======================
// popup.js — the UI shown when the user clicks the extension icon
// ======================
// WEEK 4 STUB. The submit path points at an endpoint that does not exist yet
// (POST /api/snapshots is built in Week 3/4) — expect a network error until then.

// Hardcoded for local development. Week 4: point this at the EC2 instance.
const API_BASE = "http://localhost:3000";

const eventInput = document.getElementById("event");
const priceInput = document.getElementById("price");
const submitButton = document.getElementById("submit");
const statusEl = document.getElementById("status");

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind ?? "";
}

// On open, ask content.js what it can see on the current tab. Anything it
// returns is a convenience prefill — the user can always overwrite it.
async function prefillFromPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: "READ_PRICE" });
    if (result?.eventTitle) eventInput.value = result.eventTitle;
    if (result?.price != null) {
      priceInput.value = result.price;
      setStatus("Price read from page — check it before submitting.");
    } else {
      setStatus("Could not read the price. Enter it manually.");
    }
  } catch {
    // sendMessage throws when no content script is running on this tab, i.e.
    // the user is on a site we do not support. Manual entry still works.
    setStatus("Not a supported ticket site. Enter details manually.");
  }
}

async function submitPrice() {
  const price = Number(priceInput.value);

  // Validate before hitting the network — a bad price poisons the snapshot data
  // that the Monte Carlo model depends on later.
  if (!eventInput.value.trim()) return setStatus("Enter an event name.", "error");
  if (!price || price < 1) return setStatus("Enter a valid price.", "error");

  submitButton.disabled = true;
  setStatus("Submitting…");

  try {
    const { token } = await chrome.runtime.sendMessage({ type: "GET_AUTH_TOKEN" });
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const response = await fetch(`${API_BASE}/api/snapshots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        eventTitle: eventInput.value.trim(),
        getInPrice: price,
        source: "extension",
        marketplace: tab?.url ? new URL(tab.url).hostname : "unknown",
      }),
    });

    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    setStatus("Thanks! Price submitted.", "success");
  } catch (error) {
    setStatus(`Could not submit: ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
  }
}

submitButton.addEventListener("click", submitPrice);
prefillFromPage();
