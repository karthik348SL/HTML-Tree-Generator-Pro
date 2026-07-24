import { normalizeSearchValue } from "./utils.js";

const ATTRIBUTE_QUERY = /^\[([\w:-]+)(?:=([^\]]+))?\]$/;

export class SearchController {
  constructor({ model, renderer, controls }) {
    this.model = model;
    this.renderer = renderer;
    this.input = controls.input;
    this.previousButton = controls.previousButton;
    this.nextButton = controls.nextButton;
    this.counter = controls.counter;
    this.focusReturnTarget = controls.focusReturnTarget || null;
    this.shouldIncludeNode = controls.shouldIncludeNode || (() => true);
    this.matches = [];
    this.currentIndex = -1;
    this.query = "";

    this.bindEvents();
    this.updateCounter();
  }

  bindEvents() {
    this.input.addEventListener("input", () => this.search(this.input.value));
    this.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        this.previous();
      } else if (event.key === "Enter") {
        event.preventDefault();
        this.next();
      } else if (event.key === "Escape") {
        this.clear();
        if (this.focusReturnTarget) {
          this.focusReturnTarget.focus();
        }
      }
    });

    this.previousButton.addEventListener("click", () => this.previous());
    this.nextButton.addEventListener("click", () => this.next());

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        this.input.focus();
        this.input.select();
      }
    });
  }

  search(rawQuery) {
    this.query = normalizeSearchValue(rawQuery);
    this.matches = this.query ? this.findMatches(this.query) : [];
    this.currentIndex = this.matches.length ? 0 : -1;
    this.commitSearchState();
  }

  next() {
    if (!this.matches.length) {
      return;
    }
    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    this.commitSearchState();
  }

  previous() {
    if (!this.matches.length) {
      return;
    }
    this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length;
    this.commitSearchState();
  }

  clear() {
    this.input.value = "";
    this.query = "";
    this.matches = [];
    this.currentIndex = -1;
    this.commitSearchState();
  }

  refresh() {
    if (this.query) {
      this.matches = this.findMatches(this.query);
      this.currentIndex = Math.min(this.currentIndex, this.matches.length - 1);
      if (this.currentIndex < 0 && this.matches.length) {
        this.currentIndex = 0;
      }
    }
    this.commitSearchState();
  }

  commitSearchState() {
    const matchIds = new Set(this.matches.map((node) => node.id));
    const currentNode = this.matches[this.currentIndex] || null;
    const currentId = currentNode ? currentNode.id : null;

    if (currentId) {
      this.model.expandAncestors(currentId);
    }

    this.renderer.setSearchState({ matchIds, currentId });
    this.renderer.refresh();

    if (currentId) {
      this.renderer.scrollToNode(currentId);
    }

    this.updateCounter();
  }

  updateCounter() {
    const current = this.currentIndex >= 0 ? this.currentIndex + 1 : 0;
    this.counter.textContent = `${current}/${this.matches.length}`;
    const disabled = this.matches.length === 0;
    this.previousButton.disabled = disabled;
    this.nextButton.disabled = disabled;
  }

  findMatches(query) {
    const matches = [];
    for (const node of this.model.nodes.values()) {
      if (this.shouldIncludeNode(node) && doesNodeMatch(node, query)) {
        matches.push(node);
      }
    }
    return matches;
  }
}

function doesNodeMatch(node, query) {
  if (!query) {
    return false;
  }

  if (query.startsWith("#")) {
    return normalizeSearchValue(node.elementId) === query.slice(1);
  }

  if (query.startsWith(".")) {
    const className = query.slice(1);
    return node.classes.some((value) => normalizeSearchValue(value) === className);
  }

  const attributeMatch = query.match(ATTRIBUTE_QUERY);
  if (attributeMatch) {
    const attributeName = attributeMatch[1].toLowerCase();
    const expectedValue = attributeMatch[2] === undefined ? null : stripQuotes(attributeMatch[2]);
    const attribute = node.attributes.find((item) => item.name.toLowerCase() === attributeName);
    if (!attribute) {
      return false;
    }
    return expectedValue === null || normalizeSearchValue(attribute.value) === normalizeSearchValue(expectedValue);
  }

  return normalizeSearchValue(node.tagName) === query;
}

function stripQuotes(value) {
  return String(value).trim().replace(/^["']|["']$/g, "");
}
