// Frontier Ashes — inventory UI adapter.
export function openInventory() {
  document.getElementById('inventory-btn')?.click();
}

export function closeInventory() {
  document.getElementById('close-inventory')?.click();
}

export function refreshInventory() {
  if (typeof globalThis.updateInventory === 'function') globalThis.updateInventory();
}
