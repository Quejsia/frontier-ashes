// Frontier Ashes — save system facade.
export function saveStash() {
  return typeof globalThis.saveStash === 'function' ? globalThis.saveStash() : false;
}

export function loadStash() {
  return typeof globalThis.loadStash === 'function' ? globalThis.loadStash() : undefined;
}

export function saveGame() {
  return saveStash();
}
