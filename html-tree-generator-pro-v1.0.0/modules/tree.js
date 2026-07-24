import { MAX_EXPAND_ALL_NODES } from "./constants.js";

export class TreeModel {
  constructor(snapshot) {
    this.snapshot = snapshot;
    this.root = snapshot.root;
    this.nodes = new Map();
    this.parents = new Map();
    this.expanded = new Set([this.root.id]);
    this.selectedId = this.root.id;
    this.indexTree(this.root, null);
  }

  indexTree(node, parentId) {
    this.nodes.set(node.id, node);
    if (parentId) {
      this.parents.set(node.id, parentId);
    }
    for (const child of node.children || []) {
      this.indexTree(child, node.id);
    }
  }

  getNode(nodeId) {
    return this.nodes.get(String(nodeId)) || null;
  }

  hasChildren(nodeId) {
    const node = this.getNode(nodeId);
    return Boolean(node && node.children && node.children.length);
  }

  isExpanded(nodeId) {
    return this.expanded.has(String(nodeId));
  }

  toggle(nodeId) {
    const id = String(nodeId);
    if (!this.hasChildren(id)) {
      return;
    }
    if (this.expanded.has(id)) {
      this.expanded.delete(id);
      return;
    }
    this.expanded.add(id);
  }

  expand(nodeId) {
    const id = String(nodeId);
    if (this.hasChildren(id)) {
      this.expanded.add(id);
    }
  }

  collapse(nodeId) {
    this.expanded.delete(String(nodeId));
  }

  expandAncestors(nodeId) {
    let current = this.parents.get(String(nodeId));
    while (current) {
      this.expanded.add(current);
      current = this.parents.get(current);
    }
  }

  expandAll() {
    let count = 0;
    for (const [id, node] of this.nodes) {
      if (node.children && node.children.length) {
        this.expanded.add(id);
      }
      count += 1;
      if (count >= MAX_EXPAND_ALL_NODES) {
        break;
      }
    }
  }

  collapseAll() {
    this.expanded.clear();
    this.expanded.add(this.root.id);
  }

  getVisibleRows(options = {}) {
    const shouldIncludeNode = options.shouldIncludeNode || (() => true);
    const rows = [];
    const walk = (node, depth, isRoot = false) => {
      if (!isRoot && !shouldIncludeNode(node)) {
        return;
      }

      const visibleChildren = (node.children || []).filter((child) => shouldIncludeNode(child));
      rows.push({ node, depth, hasVisibleChildren: visibleChildren.length > 0 });

      if (!this.expanded.has(node.id)) {
        return;
      }
      for (const child of visibleChildren) {
        walk(child, depth + 1);
      }
    };
    walk(this.root, 0, true);
    return rows;
  }

  getPath(nodeId) {
    const path = [];
    let current = String(nodeId);
    while (current) {
      const node = this.getNode(current);
      if (node) {
        path.unshift(node);
      }
      current = this.parents.get(current);
    }
    return path;
  }
}
