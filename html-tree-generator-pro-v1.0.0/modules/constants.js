export const SNAPSHOT_STORAGE_KEY = "htmlTreeGeneratorPro.latestSnapshot";

export const MESSAGE_TYPES = Object.freeze({
  START_CAPTURE: "HTG_START_CAPTURE",
  COLLECT_DOM: "HTG_COLLECT_DOM",
  HIGHLIGHT_NODE: "HTG_HIGHLIGHT_NODE"
});

export const CAPTURE_TIMEOUT_MS = 15000;
export const ROW_HEIGHT = 24;
export const OVERSCAN_ROWS = 12;
export const MAX_EXPAND_ALL_NODES = 20000;
