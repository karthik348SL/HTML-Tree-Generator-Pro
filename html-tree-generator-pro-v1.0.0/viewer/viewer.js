import { bindDetailsPanel } from "../modules/details.js";
import { bindExport } from "../modules/export.js";
import { FilterController } from "../modules/filter.js";
import { bindNavigation } from "../modules/navigation.js";
import { TreeRenderer } from "../modules/renderer.js";
import { SearchController } from "../modules/search.js";
import { SelectionController } from "../modules/selection.js";
import { getLatestSnapshot } from "../modules/storage.js";
import { TreeModel } from "../modules/tree.js";
import { $, formatNumber } from "../modules/utils.js";

const elements = {
  captureState: $("#capture-state"),
  treeViewport: $("#tree-viewport"),
  treeSpacer: $("#tree-spacer"),
  treeContent: $("#tree-content"),
  detailsPanel: $("#details-panel"),
  breadcrumb: $("#breadcrumb"),
  nodeCount: $("#node-count"),
  selectedNode: $("#selected-node"),
  pageTitle: $("#page-title"),
  readyStatus: $("#ready-status"),
  searchInput: $("#search-input"),
  searchPrevious: $("#search-previous"),
  searchNext: $("#search-next"),
  searchCounter: $("#search-counter"),
  filterStatus: $("#filter-status"),
  filterScripts: $("#filter-scripts"),
  filterStyles: $("#filter-styles"),
  filterSvg: $("#filter-svg"),
  filterComments: $("#filter-comments"),
  filterEmptyText: $("#filter-empty-text"),
  filterHidden: $("#filter-hidden"),
  emptyState: $("#empty-state"),
  expandAll: $("#expand-all"),
  collapseAll: $("#collapse-all"),
  expandParents: $("#expand-parents"),
  jumpRoot: $("#jump-root"),
  jumpSelected: $("#jump-selected"),
  exportScope: $("#export-scope"),
  exportFormat: $("#export-format"),
  exportDownload: $("#export-download"),
  exportCopy: $("#export-copy"),
  toast: $("#toast")
};

initializeViewer().catch((error) => {
  console.error("[HTML Tree Generator Pro] Viewer failed", error);
  elements.captureState.textContent = "Unable to load snapshot";
  elements.readyStatus.textContent = error.message || "Error";
});

async function initializeViewer() {
  const snapshot = await getLatestSnapshot();
  if (!snapshot || !snapshot.root) {
    throw new Error("No DOM snapshot found. Capture a page from the extension popup.");
  }

  document.title = `${snapshot.pageTitle || "DOM"} - HTML Tree Generator Pro`;
  elements.captureState.textContent = snapshot.truncated ? "Loaded with truncation" : "Loaded";
  elements.nodeCount.textContent = formatNumber(snapshot.nodeCount);
  elements.pageTitle.textContent = snapshot.pageTitle || snapshot.pageUrl || "-";

  const model = new TreeModel(snapshot);
  bindDetailsPanel(elements.detailsPanel);

  let selection = null;
  let filters = null;
  let search = null;
  const renderer = new TreeRenderer({
    viewport: elements.treeViewport,
    spacer: elements.treeSpacer,
    content: elements.treeContent,
    model,
    getRows: () => model.getVisibleRows({ shouldIncludeNode: (node) => filters.includes(node) }),
    onRowsChange: updateEmptyState,
    onSelect: (nodeId) => selection.select(nodeId),
    onToggle: (nodeId) => {
      model.toggle(nodeId);
      renderer.refresh();
      renderer.scrollToNode(model.selectedId);
    }
  });

  filters = new FilterController({
    model,
    controls: {
      status: elements.filterStatus,
      inputs: {
        hideScripts: elements.filterScripts,
        hideStyles: elements.filterStyles,
        hideSvg: elements.filterSvg,
        hideComments: elements.filterComments,
        hideEmptyText: elements.filterEmptyText,
        hideHidden: elements.filterHidden
      }
    },
    onChange: () => {
      if (search) {
        search.refresh();
      } else {
        renderer.refresh();
      }
    }
  });

  selection = new SelectionController({
    model,
    renderer,
    detailsPanel: elements.detailsPanel,
    breadcrumb: elements.breadcrumb,
    footerSelected: elements.selectedNode,
    tabId: snapshot.tabId
  });

  bindNavigation({
    model,
    renderer,
    selection,
    controls: {
      expandAll: elements.expandAll,
      collapseAll: elements.collapseAll,
      expandParents: elements.expandParents,
      jumpRoot: elements.jumpRoot,
      jumpSelected: elements.jumpSelected
    },
    shouldIncludeNode: (node) => filters.includes(node),
    status: elements.readyStatus
  });

  bindExport({
    snapshot,
    model,
    getSelectedNode: () => model.getNode(model.selectedId),
    controls: {
      scope: elements.exportScope,
      format: elements.exportFormat,
      downloadButton: elements.exportDownload,
      copyButton: elements.exportCopy
    },
    onStatus: (message, isError) => showToast(message, isError)
  });

  search = new SearchController({
    model,
    renderer,
    controls: {
      input: elements.searchInput,
      previousButton: elements.searchPrevious,
      nextButton: elements.searchNext,
      counter: elements.searchCounter,
      focusReturnTarget: elements.treeViewport,
      shouldIncludeNode: (node) => filters.includes(node)
    }
  });

  renderer.refresh();
  selection.select(model.root.id, { skipPageHighlight: true });
  elements.treeViewport.focus();
  elements.captureState.textContent = snapshot.truncated ? "Loaded with truncation" : "Loaded";
  elements.readyStatus.textContent = "Ready";
}

function updateEmptyState(rows) {
  elements.emptyState.classList.toggle("visible", rows.length === 0);
}

function showToast(message, isError = false) {
  window.clearTimeout(showToast.timerId);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("error", Boolean(isError));
  elements.toast.hidden = false;
  showToast.timerId = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2200);
}
