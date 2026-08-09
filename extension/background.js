// ======================
// background.js — Manifest V3 service worker
// ======================
// WEEK 4 STUB.
//
// WHY THIS FILE EXISTS: the popup is destroyed the moment the user clicks away,
// so it cannot hold anything long-lived. The service worker persists state
// (specifically the Clerk auth token, once auth lands in Week 5) in
// chrome.storage so the user does not re-authenticate on every submission.
//
// Note that MV3 service workers are also torn down when idle — never keep state
// in a plain variable here. chrome.storage is the only thing that survives.

// Log once on install so it is obvious the worker registered correctly.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Front Row extension installed");
});

// Read the stored auth token. Week 5 will write it after Clerk sign-in.
async function getAuthToken() {
  const { authToken } = await chrome.storage.local.get("authToken");
  return authToken ?? null;
}

// The popup cannot read chrome.storage on its own reliably across sessions,
// so it asks the worker for the token instead.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_AUTH_TOKEN") {
    getAuthToken().then((token) => sendResponse({ token }));
    return true; // keep the channel open for the async reply
  }
});
