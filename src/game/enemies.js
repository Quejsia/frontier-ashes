// Frontier Ashes — enemy system adapter.
export function getEnemies() {
  return globalThis.enemies ?? [];
}

export function getLivingEnemies() {
  return getEnemies().filter(enemy => enemy.hp > 0);
}

export function countLivingEnemies() {
  return getLivingEnemies().length;
}
