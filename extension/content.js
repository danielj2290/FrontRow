// ======================
// content.js — runs INSIDE the ticket marketplace page
// ======================
// WEEK 4 STUB. The structure is real; the CSS selectors are placeholders.
//
// This script is injected into StubHub / SeatGeek / Ticketmaster / Vivid pages.
// It has access to the page's DOM but NOT to the popup's JavaScript, so the two
// talk over chrome.runtime messages.
//
// IMPORTANT: every selector below WILL break eventually — these sites ship new
// markup constantly. That is expected and is exactly why the popup always offers
// manual entry. A broken selector degrades to "type it yourself", never to a
// broken extension.

// Per-site selectors. Fill these in during Week 4 by inspecting each live page.
const SELECTORS = {
  "stubhub.com": null, // TODO: get-in price element
  "seatgeek.com": null, // TODO: get-in price element
  "ticketmaster.com": null, // TODO: lowest price element
  "vividseats.com": null, // TODO: get-in price element
};

// Match the current hostname against the selector table above.
function selectorForCurrentSite() {
  const host = window.location.hostname;
  const key = Object.keys(SELECTORS).find((domain) => host.includes(domain));
  return key ? SELECTORS[key] : null;
}

// Pull the first number out of a string like "From $86 each" → 86.
// Strips currency symbols and thousands separators before parsing.
function parsePrice(text) {
  if (!text) return null;
  const match = text.replace(/,/g, "").match(/\d+(\.\d{1,2})?/);
  return match ? Number(match[0]) : null;
}

// Best-effort read. Returns null whenever anything is missing, which the popup
// treats as "show the manual entry field".
function readPriceFromPage() {
  const selector = selectorForCurrentSite();
  if (!selector) return null;

  const element = document.querySelector(selector);
  if (!element) return null;

  return parsePrice(element.textContent);
}

// The popup asks for a price when it opens; we reply with whatever we found.
// Returning true is required to keep the message channel open for sendResponse.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "READ_PRICE") {
    sendResponse({
      price: readPriceFromPage(),
      eventTitle: document.title,
      marketplace: window.location.hostname,
      url: window.location.href,
    });
  }
  return true;
});
