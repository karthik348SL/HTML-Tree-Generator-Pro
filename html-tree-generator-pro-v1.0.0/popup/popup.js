import { MESSAGE_TYPES } from "../modules/constants.js";

const captureButton = document.querySelector("#capture-button");
const feedback = document.querySelector("#capture-feedback");
const pageStatus = document.querySelector("#page-status");

captureButton.addEventListener("click", async () => {
  setBusy(true);
  setFeedback("Capturing active page...", false);

  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.START_CAPTURE });
    if (!response || response.ok === false) {
      throw new Error(response && response.error ? response.error : "Capture failed.");
    }

    setFeedback(`Captured ${response.nodeCount.toLocaleString()} nodes.`, false);
    window.setTimeout(() => window.close(), 350);
  } catch (error) {
    console.error("[HTML Tree Generator Pro] Popup capture failed", error);
    setFeedback(error.message || "Unable to capture this page.", true);
  } finally {
    setBusy(false);
  }
});

function setBusy(isBusy) {
  captureButton.disabled = isBusy;
  pageStatus.textContent = isBusy ? "Working" : "Ready";
}

function setFeedback(message, isError) {
  feedback.textContent = message;
  feedback.classList.toggle("error", Boolean(isError));
}
