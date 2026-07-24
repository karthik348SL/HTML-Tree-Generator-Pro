import { OVERSCAN_ROWS, ROW_HEIGHT } from "./constants.js";
import { createElement } from "./utils.js";

export class TreeRenderer {
  constructor({ viewport, spacer, content, model, getRows, onRowsChange, onSelect, onToggle }) {
    this.viewport = viewport;
    this.spacer = spacer;
    this.content = content;
    this.model = model;
    this.onSelect = onSelect;
    this.onToggle = onToggle;
    this.getRows = getRows || (() => this.model.getVisibleRows());
    this.onRowsChange = onRowsChange || null;
    this.rows = [];
    this.rafId = 0;
    this.searchMatchIds = new Set();
    this.currentSearchId = null;

    this.viewport.addEventListener("scroll", () => this.scheduleRender(), { passive: true });
    this.content.addEventListener("click", (event) => this.handleClick(event));
    this.viewport.addEventListener("keydown", (event) => this.handleKeyDown(event));
  }

  setRows(rows) {
    this.rows = rows;
    this.spacer.style.height = `${rows.length * ROW_HEIGHT}px`;
    if (this.onRowsChange) {
      this.onRowsChange(rows);
    }
    this.scheduleRender();
  }

  refresh() {
    this.setRows(this.getRows());
  }

  setSearchState({ matchIds, currentId }) {
    this.searchMatchIds = matchIds || new Set();
    this.currentSearchId = currentId || null;
  }

  scheduleRender() {
    if (this.rafId) {
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.render();
    });
  }

  render() {
    const scrollTop = this.viewport.scrollTop;
    const height = this.viewport.clientHeight;
    const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS);
    const last = Math.min(this.rows.length, Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN_ROWS);
    const fragment = document.createDocumentFragment();

    for (let index = first; index < last; index += 1) {
      fragment.appendChild(this.createRow(this.rows[index], index));
    }

    this.content.textContent = "";
    this.content.style.transform = `translateY(${first * ROW_HEIGHT}px)`;
    this.content.appendChild(fragment);
  }

  createRow(row, index) {
    const { node, depth } = row;
    const rowElement = createElement("div", "tree-row");
    rowElement.setAttribute("role", "treeitem");
    rowElement.setAttribute("aria-level", String(depth + 1));
    rowElement.setAttribute("aria-selected", String(this.model.selectedId === node.id));
    rowElement.dataset.nodeId = node.id;
    rowElement.dataset.index = String(index);
    rowElement.style.paddingLeft = `${depth * 16 + 8}px`;

    if (this.model.selectedId === node.id) {
      rowElement.classList.add("selected");
    }
    if (this.searchMatchIds.has(node.id)) {
      rowElement.classList.add("search-match");
    }
    if (this.currentSearchId === node.id) {
      rowElement.classList.add("search-current");
    }

    const toggle = createElement("button", "node-toggle");
    toggle.type = "button";
    toggle.tabIndex = -1;
    toggle.dataset.action = "toggle";

    if (row.hasVisibleChildren ?? this.model.hasChildren(node.id)) {
      toggle.classList.toggle("expanded", this.model.isExpanded(node.id));
      toggle.setAttribute("aria-label", this.model.isExpanded(node.id) ? "Collapse node" : "Expand node");
    } else {
      toggle.classList.add("empty");
      toggle.setAttribute("aria-hidden", "true");
    }

    const label = createElement("span", "node-label");
    label.appendChild(createElement("span", "syntax-angle", "<"));
    label.appendChild(createElement("span", "syntax-tag", node.tagName));
    if (node.elementId) {
      label.appendChild(createElement("span", "syntax-id", `#${node.elementId}`));
    }
    if (node.classes && node.classes.length) {
      label.appendChild(createElement("span", "syntax-class", `.${node.classes.slice(0, 3).join(".")}`));
    }
    label.appendChild(createElement("span", "syntax-angle", ">"));
    if (node.textPreview) {
      label.appendChild(createElement("span", "text-preview", ` ${node.textPreview}`));
    }

    rowElement.append(toggle, label);
    return rowElement;
  }

  scrollToNode(nodeId) {
    const index = this.rows.findIndex((row) => row.node.id === String(nodeId));
    if (index < 0) {
      return;
    }
    const top = index * ROW_HEIGHT;
    const bottom = top + ROW_HEIGHT;
    if (top < this.viewport.scrollTop) {
      this.viewport.scrollTop = top;
    } else if (bottom > this.viewport.scrollTop + this.viewport.clientHeight) {
      this.viewport.scrollTop = bottom - this.viewport.clientHeight;
    }
  }

  handleClick(event) {
    const row = event.target.closest(".tree-row");
    if (!row) {
      return;
    }

    const nodeId = row.dataset.nodeId;
    if (event.target.closest("[data-action='toggle']")) {
      this.onToggle(nodeId);
      return;
    }

    this.onSelect(nodeId);
  }

  handleKeyDown(event) {
    const visibleIds = this.rows.map((row) => row.node.id);
    const anchorId = getVisibleKeyboardAnchor(this.model, visibleIds);
    const currentIndex = Math.max(0, visibleIds.indexOf(anchorId));
    let nextId = null;

    if (event.key === "ArrowDown") {
      nextId = visibleIds[Math.min(visibleIds.length - 1, currentIndex + 1)];
    } else if (event.key === "ArrowUp") {
      nextId = visibleIds[Math.max(0, currentIndex - 1)];
    } else if (event.key === "Home") {
      nextId = visibleIds[0];
    } else if (event.key === "End") {
      nextId = visibleIds[visibleIds.length - 1];
    } else if (event.key === "ArrowRight") {
      if (this.model.hasChildren(anchorId) && !this.model.isExpanded(anchorId)) {
        this.onToggle(anchorId);
      }
    } else if (event.key === "ArrowLeft") {
      if (this.model.isExpanded(anchorId)) {
        this.onToggle(anchorId);
      }
    } else if (event.key === "Enter" || event.key === " ") {
      this.onToggle(anchorId);
    } else {
      return;
    }

    event.preventDefault();
    if (nextId) {
      this.onSelect(nextId);
    }
  }
}

function getVisibleKeyboardAnchor(model, visibleIds) {
  if (visibleIds.includes(model.selectedId)) {
    return model.selectedId;
  }

  const path = model.getPath(model.selectedId);
  for (let index = path.length - 1; index >= 0; index -= 1) {
    if (visibleIds.includes(path[index].id)) {
      return path[index].id;
    }
  }

  return visibleIds[0] || model.root.id;
}
