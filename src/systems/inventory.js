// Frontier Ashes — inventory facade.
export function getInventory() {
  return globalThis.inv ?? null;
}

export function getRaidInventory() {
  return globalThis.raidInventory ?? null;
}

export function getStash() {
  return globalThis.stash ?? null;
}

export function refreshInventoryUI() {
  if (typeof globalThis.updateInventory === 'function') globalThis.updateInventory();
}
