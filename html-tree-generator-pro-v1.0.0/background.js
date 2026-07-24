import { CAPTURE_TIMEOUT_MS, MESSAGE_TYPES, SNAPSHOT_STORAGE_KEY } from "./modules/constants.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== MESSAGE_TYPES.START_CAPTURE) {
    return false;
  }

  captureActiveTab()
    .then(sendResponse)
    .catch((error) => {
      console.error("[HTML Tree Generator Pro] Capture failed", error);
      sendResponse({ ok: false, error: error.message || "Unable to capture page DOM." });
    });

  return true;
});

async function captureActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !tab.url) {
    throw new Error("No active tab is available.");
  }

  if (!isCaptureAllowed(tab.url)) {
    throw new Error("Chrome internal pages and extension pages cannot be inspected.");
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  const snapshot = await sendMessageWithTimeout(tab.id, {
    type: MESSAGE_TYPES.COLLECT_DOM,
    options: {
      includeShadowDom: true
    }
  });

  if (!snapshot || !snapshot.root) {
    throw new Error("The page did not return a valid DOM snapshot.");
  }

  const payload = {
    ...snapshot,
    capturedAt: Date.now(),
    tabId: tab.id,
    pageTitle: tab.title || snapshot.pageTitle || "Untitled page",
    pageUrl: tab.url
  };

  await chrome.storage.session.set({ [SNAPSHOT_STORAGE_KEY]: payload });
  await chrome.tabs.create({ url: chrome.runtime.getURL("viewer/viewer.html") });

  return {
    ok: true,
    nodeCount: payload.nodeCount,
    pageTitle: payload.pageTitle
  };
}

function sendMessageWithTimeout(tabId, message) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timerId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new Error("Timed out while waiting for the page DOM."));
    }, CAPTURE_TIMEOUT_MS);

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timerId);

      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }

      if (response && response.ok === false) {
        reject(new Error(response.error || "The page reported a capture error."));
        return;
      }

      resolve(response);
    });
  });
}

function isCaptureAllowed(url) {
  return /^(https?:|file:)/i.test(url);
}
