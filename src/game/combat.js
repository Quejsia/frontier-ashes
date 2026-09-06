// Frontier Ashes — combat facade.
export function shoot() {
  if (typeof globalThis.fire === 'function') globalThis.fire();
}

export function reload() {
  if (typeof globalThis.reload === 'function') globalThis.reload();
}

export function dodge() {
  if (typeof globalThis.dodge === 'function') globalThis.dodge();
}
