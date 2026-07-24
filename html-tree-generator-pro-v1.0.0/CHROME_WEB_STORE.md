# Chrome Web Store Listing

## Short Description

Visualize, search, filter, inspect, and export any webpage DOM as a fast interactive tree.

## Full Description

HTML Tree Generator Pro visualizes the DOM hierarchy of the active webpage in a polished, DevTools-inspired tree viewer. It is built for developers, QA engineers, designers, technical writers, and anyone who needs to inspect page structure quickly without leaving the browser.

## Overview

Click the extension, generate a DOM tree, and inspect the page structure in a dedicated viewer tab. The viewer is designed for large pages and keeps rendering responsive with virtualized rows.

## Features

- Fast DOM capture from the active tab.
- Interactive tree with expand, collapse, expand all, collapse all, and expand parents.
- Node selection with details for tag, id, classes, attributes, text preview, children count, and depth.
- Page element highlighting for selected nodes.
- Breadcrumb navigation and jump controls.
- Export the entire tree or selected node.

## Search

Search supports common DOM queries:

- Tag names such as `div`
- IDs such as `#header`
- Classes such as `.container`
- Attributes such as `[href]`
- Attribute values such as `[type=text]`

Search includes next/previous navigation, match counts, match highlighting, automatic ancestor expansion, and scroll-to-current-match.

## Filters

Hide categories without destroying tree state:

- Scripts
- Styles
- SVG
- Comments
- Empty text
- Hidden nodes

## Navigation

Navigate with root/selected jumps, clickable breadcrumbs, keyboard controls, expand parents, expand all, and collapse all.

## Export

Export JSON, TXT, or HTML. Choose between the entire tree and the selected node. Exported files preserve hierarchy, and exports can also be copied to the clipboard.

## Privacy

HTML Tree Generator Pro runs locally in your browser. It does not transmit page content, browsing data, DOM snapshots, clipboard data, or exports to external servers.

## Performance

The viewer uses a serialized DOM snapshot and virtualized rendering so large pages remain responsive. The viewer never directly inspects the source page DOM.

## Release Notes

### Version 1.0.0

- Initial production release.
- Manifest V3 extension architecture.
- DOM serialization, virtualized tree rendering, search, filters, navigation, details panel, page highlighting, and exports.
- Hardened permissions and privacy posture for Chrome Web Store publication.

## Keywords

HTML, DOM, DOM tree, HTML tree, DevTools, developer tools, Chrome extension, web development, frontend, inspect element, page structure, XPath, CSS selector, export DOM, QA testing
