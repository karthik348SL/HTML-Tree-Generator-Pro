export const DEFAULT_FILTER_STATE = Object.freeze({
  hideScripts: false,
  hideStyles: false,
  hideSvg: false,
  hideComments: false,
  hideEmptyText: false,
  hideHidden: false
});

const COMMENT_NODE = 8;
const TEXT_NODE = 3;

export class FilterController {
  constructor({ model, controls, onChange }) {
    this.model = model;
    this.controls = controls;
    this.onChange = onChange;
    this.state = { ...DEFAULT_FILTER_STATE };

    this.bindEvents();
    this.updateStatus();
  }

  bindEvents() {
    for (const [key, input] of Object.entries(this.controls.inputs)) {
      input.checked = Boolean(this.state[key]);
      input.addEventListener("change", () => {
        this.state[key] = input.checked;
        this.updateStatus();
        this.onChange();
      });
    }
  }

  includes(node) {
    return Boolean(node) && !this.excludes(node);
  }

  excludes(node) {
    if (!node) {
      return true;
    }

    const tagName = String(node.tagName || "").toLowerCase();

    if (this.state.hideScripts && tagName === "script") {
      return true;
    }
    if (this.state.hideStyles && tagName === "style") {
      return true;
    }
    if (this.state.hideSvg && tagName === "svg") {
      return true;
    }
    if (this.state.hideComments && (node.type === COMMENT_NODE || tagName === "#comment")) {
      return true;
    }
    if (this.state.hideEmptyText && isEmptyTextNode(node)) {
      return true;
    }
    if (this.state.hideHidden && node.isHidden) {
      return true;
    }

    return false;
  }

  updateStatus() {
    if (!this.controls.status) {
      return;
    }

    const activeCount = Object.values(this.state).filter(Boolean).length;
    this.controls.status.textContent = activeCount ? `${activeCount} active` : "None";
  }
}

function isEmptyTextNode(node) {
  const tagName = String(node.tagName || "").toLowerCase();
  return (node.type === TEXT_NODE || tagName === "#text") && !String(node.textPreview || "").trim();
}
