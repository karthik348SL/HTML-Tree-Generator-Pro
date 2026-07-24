# HTML Tree Generator Pro

HTML Tree Generator Pro is a Manifest V3 Chrome extension for visualizing the DOM hierarchy of the active page in a fast, DevTools-inspired tree viewer.

## Features

- Capture the active page DOM on demand.
- Render large DOM trees with virtualized rows.
- Expand, collapse, expand all, collapse all, and expand parents.
- Select nodes, inspect details, and highlight the corresponding page element.
- Search by tag, id, class, attribute, and attribute value.
- Filter scripts, styles, SVG, comments, empty text, and hidden nodes.
- Navigate with breadcrumbs, root/selected jumps, and keyboard controls.
- Export the entire tree or selected node as JSON, TXT, or HTML.
- Copy selectors, XPath, HTML snippets, and tree exports to the clipboard.

## Installation

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select the `html-tree-generator-pro` folder.
5. Pin the extension from the Chrome toolbar if desired.

## Usage

1. Open any supported `http`, `https`, or `file` page.
2. Click the HTML Tree Generator Pro toolbar icon.
3. Click Generate Tree.
4. Use the viewer tab to inspect, search, filter, navigate, and export the DOM tree.

## Keyboard Shortcuts

- `Ctrl+F` or `Cmd+F`: Focus tree search.
- `Enter`: Move to the next search match.
- `Shift+Enter`: Move to the previous search match.
- `Escape`: Clear search and return focus to the tree.
- `Arrow Up` / `Arrow Down`: Move selection through visible rows.
- `Arrow Right`: Expand the selected row when possible.
- `Arrow Left`: Collapse the selected row when possible.
- `Home`: Jump to the first visible row.
- `End`: Jump to the last visible row.
- `Space` or `Enter` in the tree: Toggle the selected row.

## Permissions

- `activeTab`: Allows DOM capture only for the tab where the user starts the extension.
- `scripting`: Injects the content script after the user clicks Generate Tree.
- `storage`: Temporarily stores the serialized DOM snapshot for the viewer tab.
- `tabs`: Opens the viewer tab and reads active tab metadata such as title and URL.

The extension does not request broad host permissions.

## Export Formats

- `JSON`: Structured snapshot data with metadata and hierarchy.
- `TXT`: Plain text tree with indentation.
- `HTML`: Standalone readable HTML document preserving the hierarchy.

Exports can target the entire tree or the currently selected node.

## Browser Compatibility

HTML Tree Generator Pro targets Chromium-based browsers that support Manifest V3. Chrome 114 or newer is recommended.

## Privacy

HTML Tree Generator Pro processes page DOM data locally in your browser. It does not transmit page content, browsing data, exports, or copied values to external servers.

## Version 1.0.0 Release Notes

- Production-ready core DOM capture and serialized viewer flow.
- Virtualized tree rendering for large pages.
- Search, filters, navigation, details panel, page highlighting, and export workflow.
- RC1 hardening for permissions, clipboard/export errors, HTML snippet escaping, and empty-state rendering.

## Validation

Run syntax checks from this folder:

```powershell
node --check background.js
node --check content.js
node --check popup/popup.js
node --check viewer/viewer.js
node --check modules/tree.js
node --check modules/renderer.js
node --check modules/selection.js
node --check modules/navigation.js
node --check modules/search.js
node --check modules/filter.js
node --check modules/details.js
node --check modules/export.js
node --check modules/storage.js
node --check modules/utils.js
```
