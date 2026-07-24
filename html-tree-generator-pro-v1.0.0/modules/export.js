import { copyText } from "./utils.js";

const EXPORT_MIME_TYPES = Object.freeze({
  json: "application/json;charset=utf-8",
  txt: "text/plain;charset=utf-8",
  html: "text/html;charset=utf-8"
});

export function bindExport({ controls, snapshot, model, getSelectedNode, onStatus }) {
  controls.downloadButton.addEventListener("click", () => {
    try {
      const exportData = createExportData({ snapshot, model, selectedNode: getSelectedNode(), controls });
      downloadExport(exportData);
      notify(onStatus, `Exported ${exportData.filename}`);
    } catch (error) {
      console.info("[HTML Tree Generator Pro] Export failed", error);
      notify(onStatus, "Export failed", true);
    }
  });

  controls.copyButton.addEventListener("click", async () => {
    try {
      const exportData = createExportData({ snapshot, model, selectedNode: getSelectedNode(), controls });
      await copyText(exportData.content);
      notify(onStatus, `Copied ${exportData.label}`);
    } catch (error) {
      console.info("[HTML Tree Generator Pro] Copy export failed", error);
      notify(onStatus, "Copy failed", true);
    }
  });
}

export function createExportData({ snapshot, model, selectedNode, controls }) {
  const format = controls.format.value;
  const scope = controls.scope.value;
  const rootNode = scope === "selected" && selectedNode ? selectedNode : model.root;
  const label = scope === "selected" ? "selected node" : "entire tree";
  const filenameBase = `${sanitizeFilename(snapshot.pageTitle || "html-tree")}-${scope}`;

  if (format === "json") {
    return {
      content: buildJsonExport({ snapshot, rootNode, scope }),
      filename: `${filenameBase}.json`,
      label,
      mimeType: EXPORT_MIME_TYPES.json
    };
  }

  if (format === "html") {
    return {
      content: buildHtmlExport({ snapshot, rootNode, scope }),
      filename: `${filenameBase}.html`,
      label,
      mimeType: EXPORT_MIME_TYPES.html
    };
  }

  return {
    content: buildTxtExport(rootNode),
    filename: `${filenameBase}.txt`,
    label,
    mimeType: EXPORT_MIME_TYPES.txt
  };
}

export function buildJsonExport({ snapshot, rootNode, scope }) {
  return JSON.stringify({
    title: snapshot.pageTitle || "",
    url: snapshot.pageUrl || "",
    capturedAt: snapshot.capturedAt || null,
    scope,
    root: cloneExportNode(rootNode)
  }, null, 2);
}

export function buildTxtExport(rootNode) {
  return rowsFromNode(rootNode)
    .map(({ node, depth }) => `${"  ".repeat(depth)}${formatNodeLabel(node)}`)
    .join("\n");
}

export function buildHtmlExport({ snapshot, rootNode, scope }) {
  const title = escapeHtml(snapshot.pageTitle || "HTML Tree Export");
  const rows = rowsFromNode(rootNode)
    .map(({ node, depth }) => {
      const indent = "&nbsp;".repeat(depth * 4);
      return `<li>${indent}${escapeHtml(formatNodeLabel(node))}</li>`;
    })
    .join("\n");

  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "  <meta charset=\"utf-8\">",
    `  <title>${title}</title>`,
    "  <style>body{font:13px/1.5 system-ui,sans-serif;background:#11151a;color:#e7edf5}ol{padding-left:0;list-style:none}li{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre}</style>",
    "</head>",
    "<body>",
    `  <h1>${title}</h1>`,
    `  <p>Scope: ${escapeHtml(scope)}</p>`,
    "  <ol>",
    rows,
    "  </ol>",
    "</body>",
    "</html>"
  ].join("\n");
}

export function rowsFromNode(rootNode) {
  const rows = [];
  const walk = (node, depth) => {
    rows.push({ node, depth });
    for (const child of node.children || []) {
      walk(child, depth + 1);
    }
  };
  walk(rootNode, 0);
  return rows;
}

function cloneExportNode(node) {
  return {
    id: node.id,
    parentId: node.parentId,
    tagName: node.tagName,
    elementId: node.elementId,
    classes: node.classes,
    attributes: node.attributes,
    textPreview: node.textPreview,
    childCount: node.childCount,
    depth: node.depth,
    isHidden: node.isHidden,
    selector: node.selector,
    xpath: node.xpath,
    children: (node.children || []).map(cloneExportNode)
  };
}

function formatNodeLabel(node) {
  const id = node.elementId ? `#${node.elementId}` : "";
  const classes = node.classes && node.classes.length ? `.${node.classes.join(".")}` : "";
  const text = node.textPreview ? ` ${node.textPreview}` : "";
  return `<${node.tagName}${id}${classes}>${text}`;
}

function downloadExport(exportData) {
  const blob = new Blob([exportData.content], { type: exportData.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = exportData.filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function notify(onStatus, message, isError = false) {
  if (onStatus) {
    onStatus(message, isError);
  }
}

function sanitizeFilename(value) {
  return String(value).replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80) || "html-tree";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
