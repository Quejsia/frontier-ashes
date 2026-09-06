// Frontier Ashes — player adapter.
// Keeps player-facing APIs isolated while the legacy canvas engine is migrated.
export function getPlayer() {
  return globalThis.player ?? null;
}

export function movePlayer(dx, dy) {
  const player = getPlayer();
  if (!player) return;
  const length = Math.hypot(dx, dy) || 1;
  player.x += (dx / length) * player.speed;
  player.y += (dy / length) * player.speed;
}

export function setPlayerAngle(angle) {
  const player = getPlayer();
  if (player) player.angle = angle;
}
