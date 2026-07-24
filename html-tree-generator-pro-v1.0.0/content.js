(function initializeHtmlTreeGeneratorContentScript() {
  if (window.__htmlTreeGeneratorProLoaded) {
    return;
  }
  window.__htmlTreeGeneratorProLoaded = true;

  const MESSAGE_TYPES = {
    COLLECT_DOM: "HTG_COLLECT_DOM",
    HIGHLIGHT_NODE: "HTG_HIGHLIGHT_NODE"
  };

  const MAX_NODES = 50000;
  const MAX_DEPTH = 120;
  const MAX_TEXT_LENGTH = 180;
  const MAX_ATTRIBUTE_VALUE_LENGTH = 240;
  const MAX_ATTRIBUTES = 80;
  const SKIPPED_TAGS = new Set(["SCRIPT"]);
  const NODE_MAP = new Map();
  let overlay = null;
  let clearTimer = null;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) {
      return false;
    }

    if (message.type === MESSAGE_TYPES.COLLECT_DOM) {
      try {
        const snapshot = serializeCurrentDocument(Boolean(message.options && message.options.includeShadowDom));
        sendResponse(snapshot);
      } catch (error) {
        console.error("[HTML Tree Generator Pro] Serialization failed", error);
        sendResponse({ ok: false, error: error.message || "Unable to serialize DOM." });
      }
      return true;
    }

    if (message.type === MESSAGE_TYPES.HIGHLIGHT_NODE) {
      const didHighlight = highlightNode(message.nodeId);
      sendResponse({ ok: didHighlight });
      return true;
    }

    return false;
  });

  function serializeCurrentDocument(includeShadowDom) {
    NODE_MAP.clear();
    const seen = new WeakSet();
    const state = {
      nextId: 1,
      nodeCount: 0,
      truncated: false
    };

    const root = serializeElement(document.documentElement, null, 0, seen, state, includeShadowDom);

    return {
      ok: true,
      root,
      nodeCount: state.nodeCount,
      truncated: state.truncated,
      pageTitle: document.title,
      pageUrl: location.href,
      doctype: document.doctype ? document.doctype.name : null
    };
  }

  function serializeElement(element, parentId, depth, seen, state, includeShadowDom) {
    if (!element || state.nodeCount >= MAX_NODES || depth > MAX_DEPTH || seen.has(element)) {
      state.truncated = true;
      return null;
    }

    seen.add(element);

    const tagName = element.tagName ? element.tagName.toLowerCase() : "#node";
    if (SKIPPED_TAGS.has(tagName.toUpperCase())) {
      return null;
    }

    const nodeId = String(state.nextId++);
    state.nodeCount += 1;
    NODE_MAP.set(nodeId, element);

    const serialized = {
      id: nodeId,
      parentId,
      type: element.nodeType,
      tagName,
      elementId: element.id || "",
      classes: Array.from(element.classList || []),
      attributes: serializeAttributes(element),
      textPreview: getTextPreview(element),
      selector: getCssSelector(element),
      xpath: getXPath(element),
      childCount: 0,
      depth,
      isHidden: isElementHidden(element),
      children: []
    };

    if (includeShadowDom && element.shadowRoot) {
      const shadowNode = serializeShadowRoot(element.shadowRoot, nodeId, depth + 1, seen, state, includeShadowDom);
      if (shadowNode) {
        serialized.children.push(shadowNode);
      }
    }

    for (const child of element.children) {
      const childNode = serializeElement(child, nodeId, depth + 1, seen, state, includeShadowDom);
      if (childNode) {
        serialized.children.push(childNode);
      }
      if (state.nodeCount >= MAX_NODES) {
        state.truncated = true;
        break;
      }
    }

    serialized.childCount = serialized.children.length;
    return serialized;
  }

  function serializeShadowRoot(root, parentId, depth, seen, state, includeShadowDom) {
    if (state.nodeCount >= MAX_NODES || depth > MAX_DEPTH) {
      state.truncated = true;
      return null;
    }

    const nodeId = String(state.nextId++);
    state.nodeCount += 1;
    const serialized = {
      id: nodeId,
      parentId,
      type: Node.DOCUMENT_FRAGMENT_NODE,
      tagName: "#shadow-root",
      elementId: "",
      classes: [],
      attributes: [],
      textPreview: "",
      selector: "",
      xpath: "",
      childCount: 0,
      depth,
      isHidden: false,
      children: []
    };

    for (const child of root.children) {
      const childNode = serializeElement(child, nodeId, depth + 1, seen, state, includeShadowDom);
      if (childNode) {
        serialized.children.push(childNode);
      }
    }

    serialized.childCount = serialized.children.length;
    return serialized;
  }

  function serializeAttributes(element) {
    const result = [];
    const attributes = Array.from(element.attributes || []).slice(0, MAX_ATTRIBUTES);
    for (const attribute of attributes) {
      result.push({
        name: attribute.name,
        value: truncate(attribute.value, MAX_ATTRIBUTE_VALUE_LENGTH)
      });
    }
    return result;
  }

  function getTextPreview(element) {
    const pieces = [];
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = normalizeWhitespace(child.nodeValue || "");
        if (text) {
          pieces.push(text);
        }
      }
      if (pieces.join(" ").length >= MAX_TEXT_LENGTH) {
        break;
      }
    }
    return truncate(pieces.join(" "), MAX_TEXT_LENGTH);
  }

  function getCssSelector(element) {
    if (!element || !element.tagName) {
      return "";
    }

    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }

    const parts = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
      let part = current.tagName.toLowerCase();
      if (current.classList.length > 0) {
        part += `.${Array.from(current.classList).slice(0, 3).map((name) => CSS.escape(name)).join(".")}`;
      }

      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((item) => item.tagName === current.tagName);
        if (siblings.length > 1) {
          part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }

      parts.unshift(part);
      current = parent;
    }

    return parts.join(" > ");
  }

  function getXPath(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const segments = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const tagName = current.tagName.toLowerCase();
      const siblings = current.parentElement
        ? Array.from(current.parentElement.children).filter((item) => item.tagName === current.tagName)
        : [];
      const index = siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : "";
      segments.unshift(`${tagName}${index}`);
      current = current.parentElement;
    }

    return `/${segments.join("/")}`;
  }

  function isElementHidden(element) {
    const style = window.getComputedStyle(element);
    return style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0;
  }

  function highlightNode(nodeId) {
    const element = NODE_MAP.get(String(nodeId));
    if (!element || !element.getBoundingClientRect) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      return false;
    }

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.zIndex = "2147483647";
      overlay.style.pointerEvents = "none";
      overlay.style.border = "2px solid #4da3ff";
      overlay.style.background = "rgba(77, 163, 255, 0.14)";
      overlay.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.08)";
      document.documentElement.appendChild(overlay);
    }

    overlay.style.left = `${Math.max(0, rect.left)}px`;
    overlay.style.top = `${Math.max(0, rect.top)}px`;
    overlay.style.width = `${Math.max(1, rect.width)}px`;
    overlay.style.height = `${Math.max(1, rect.height)}px`;

    window.clearTimeout(clearTimer);
    clearTimer = window.setTimeout(() => {
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
    }, 1800);

    return true;
  }

  function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function truncate(value, limit) {
    if (!value || value.length <= limit) {
      return value || "";
    }
    return `${value.slice(0, limit - 1)}...`;
  }
})();
