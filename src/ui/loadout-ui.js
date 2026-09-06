// Frontier Ashes — loadout UI adapter.
export function openLoadout() {
  if (typeof globalThis.openLoadout === 'function') return globalThis.openLoadout();
  document.getElementById('loadout-panel')?.classList.remove('hidden');
}

export function prepareLoadout() {
  if (typeof globalThis.prepareLoadout === 'function') return globalThis.prepareLoadout();
  return false;
}
