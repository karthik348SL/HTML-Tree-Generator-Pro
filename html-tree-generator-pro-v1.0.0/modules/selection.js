import { MESSAGE_TYPES } from "./constants.js";

export class SelectionController {
  constructor({ model, renderer, detailsPanel, breadcrumb, footerSelected, tabId }) {
    this.model = model;
    this.renderer = renderer;
    this.detailsPanel = detailsPanel;
    this.breadcrumb = breadcrumb;
    this.footerSelected = footerSelected;
    this.tabId = tabId;

    this.breadcrumb.addEventListener("click", (event) => {
      const button = event.target.closest("[data-breadcrumb-node]");
      if (button) {
        this.select(button.dataset.breadcrumbNode);
      }
    });
  }

  select(nodeId, options = {}) {
    const node = this.model.getNode(nodeId);
    if (!node) {
      return;
    }

    this.model.selectedId = node.id;
    this.model.expandAncestors(node.id);
    this.renderer.refresh();
    this.renderer.scrollToNode(node.id);
    this.updateDetails(node);
    this.updateBreadcrumb(node.id);
    this.footerSelected.textContent = node.tagName;

    if (!options.skipPageHighlight) {
      this.highlightPageNode(node.id);
    }
  }

  updateDetails(node) {
    this.detailsPanel.dispatchEvent(new CustomEvent("details:update", { detail: { node } }));
  }

  updateBreadcrumb(nodeId) {
    const path = this.model.getPath(nodeId);
    const fragment = document.createDocumentFragment();

    path.forEach((node, index) => {
      if (index > 0) {
        const separator = document.createElement("span");
        separator.className = "breadcrumb-separator";
        separator.textContent = ">";
        fragment.appendChild(separator);
      }

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.breadcrumbNode = node.id;
      button.textContent = node.tagName;
      button.setAttribute("aria-label", `Jump to ${node.tagName}`);
      fragment.appendChild(button);
    });

    this.breadcrumb.textContent = "";
    this.breadcrumb.appendChild(fragment);
  }

  async highlightPageNode(nodeId) {
    if (!this.tabId) {
      return;
    }
    try {
      await chrome.tabs.sendMessage(this.tabId, { type: MESSAGE_TYPES.HIGHLIGHT_NODE, nodeId });
    } catch (error) {
      console.info("[HTML Tree Generator Pro] Page highlight unavailable", error);
    }
  }
}
