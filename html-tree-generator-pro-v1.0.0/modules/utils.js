export function $(selector, root = document) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

export function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export async function copyText(value) {
  if (!value) {
    return false;
  }
  await navigator.clipboard.writeText(value);
  return true;
}

export function normalizeSearchValue(value) {
  return String(value || "").trim().toLowerCase();
}
