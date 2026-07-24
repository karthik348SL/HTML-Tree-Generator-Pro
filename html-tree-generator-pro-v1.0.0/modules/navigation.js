export function bindNavigation({ model, renderer, selection, controls, shouldIncludeNode, status }) {
  const includesNode = shouldIncludeNode || (() => true);

  controls.expandAll.addEventListener("click", () => {
    model.expandAll();
    renderer.refresh();
  });

  controls.collapseAll.addEventListener("click", () => {
    model.collapseAll();
    renderer.refresh();
  });

  controls.expandParents.addEventListener("click", () => {
    model.expandAncestors(model.selectedId);
    renderer.refresh();
    scrollToVisibleSelection({ model, renderer, includesNode, status });
  });

  controls.jumpRoot.addEventListener("click", () => {
    selection.select(model.root.id);
  });

  controls.jumpSelected.addEventListener("click", () => {
    model.expandAncestors(model.selectedId);
    renderer.refresh();
    scrollToVisibleSelection({ model, renderer, includesNode, status });
  });
}

function scrollToVisibleSelection({ model, renderer, includesNode, status }) {
  if (includesNode(model.getNode(model.selectedId))) {
    renderer.scrollToNode(model.selectedId);
    setStatus(status, "Selected node");
    return;
  }

  const fallback = findNearestVisibleAncestor(model, model.selectedId, includesNode);
  if (fallback) {
    renderer.scrollToNode(fallback.id);
    setStatus(status, "Selected node hidden by filters");
    return;
  }

  setStatus(status, "Selected node hidden");
}

function findNearestVisibleAncestor(model, nodeId, includesNode) {
  const path = model.getPath(nodeId);
  for (let index = path.length - 1; index >= 0; index -= 1) {
    if (includesNode(path[index])) {
      return path[index];
    }
  }
  return null;
}

function setStatus(element, message) {
  if (element) {
    element.textContent = message;
  }
}
