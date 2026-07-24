import { SNAPSHOT_STORAGE_KEY } from "./constants.js";

export async function getLatestSnapshot() {
  const result = await chrome.storage.session.get(SNAPSHOT_STORAGE_KEY);
  return result[SNAPSHOT_STORAGE_KEY] || null;
}

export async function clearLatestSnapshot() {
  await chrome.storage.session.remove(SNAPSHOT_STORAGE_KEY);
}
