import { copyText } from "./utils.js";

export function bindDetailsPanel(panel) {
  const fields = {
    tag: panel.querySelector("[data-field='tag']"),
    id: panel.querySelector("[data-field='id']"),
    classes: panel.querySelector("[data-field='classes']"),
    attrs: panel.querySelector("[data-field='attrs']"),
    text: panel.querySelector("[data-field='text']"),
    children: panel.querySelector("[data-field='children']"),
    depth: panel.querySelector("[data-field='depth']")
  };
  let currentNode = null;

  panel.addEventListener("details:update", (event) => {
    currentNode = event.detail.node;
    fields.tag.textContent = currentNode.tagName;
    fields.id.textContent = currentNode.elementId || "-";
    fields.classes.textContent = currentNode.classes.length ? currentNode.classes.join(" ") : "-";
    fields.attrs.textContent = currentNode.attributes.length
      ? currentNode.attributes.map((attr) => `${attr.name}="${attr.value}"`).join("\n")
      : "-";
    fields.text.textContent = currentNode.textPreview || "-";
    fields.children.textContent = String(currentNode.childCount);
    fields.depth.textContent = String(currentNode.depth);
  });

  panel.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-copy]");
    if (!action || !currentNode) {
      return;
    }

    const key = action.dataset.copy;
    const values = {
      selector: currentNode.selector,
      xpath: currentNode.xpath,
      html: buildHtmlSnippet(currentNode)
    };
    try {
      await copyText(values[key] || "");
    } catch (error) {
      console.info("[HTML Tree Generator Pro] Unable to copy node detail", error);
    }
  });
}

function buildHtmlSnippet(node) {
  const attrs = [];
  if (node.elementId) {
    attrs.push(`id="${escapeAttribute(node.elementId)}"`);
  }
  if (node.classes.length) {
    attrs.push(`class="${escapeAttribute(node.classes.join(" "))}"`);
  }
  for (const attr of node.attributes) {
    if (attr.name === "id" || attr.name === "class") {
      continue;
    }
    attrs.push(`${attr.name}="${escapeAttribute(attr.value)}"`);
  }

  const open = attrs.length ? `<${node.tagName} ${attrs.join(" ")}>` : `<${node.tagName}>`;
  return node.childCount ? `${open}...</${node.tagName}>` : `${open}${escapeText(node.textPreview)}</${node.tagName}>`;
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escapeText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
