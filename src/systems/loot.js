// Frontier Ashes — loot facade.
export function getCrates() {
  return globalThis.crates ?? [];
}

export function getCurrentCrate() {
  return globalThis.currentCrate ?? null;
}

export function takeAll() {
  if (typeof globalThis.takeAll === 'function') globalThis.takeAll();
}

export function closeLoot() {
  if (typeof globalThis.closeLoot === 'function') globalThis.closeLoot();
}
