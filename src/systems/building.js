// Frontier Ashes — building system foundation.
// The building API is intentionally independent from the canvas engine so the
// base-building phase can grow without coupling UI and rendering code.
const buildings = [];

export function getBuildings() {
  return buildings;
}

export function canPlaceBuilding(x, y, width = 32, height = 32) {
  return Number.isFinite(x) && Number.isFinite(y) && width > 0 && height > 0;
}

export function placeBuilding(type, x, y, options = {}) {
  if (!canPlaceBuilding(x, y, options.width, options.height)) return null;
  const building = { id: crypto.randomUUID?.() ?? `building-${Date.now()}-${buildings.length}`, type, x, y, ...options };
  buildings.push(building);
  return building;
}

export function removeBuilding(id) {
  const index = buildings.findIndex(building => building.id === id);
  if (index < 0) return false;
  buildings.splice(index, 1);
  return true;
}
