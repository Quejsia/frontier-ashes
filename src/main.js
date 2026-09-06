// Frontier Ashes — Vite entry point.
// The existing canvas engine remains intact while systems are migrated into modules.
import * as Player from './game/player.js';
import * as Enemies from './game/enemies.js';
import * as Weapons from './game/weapons.js';
import * as Combat from './game/combat.js';
import * as Inventory from './systems/inventory.js';
import * as Loot from './systems/loot.js';
import * as Building from './systems/building.js';
import * as Save from './systems/save.js';
import * as InventoryUI from './ui/inventory-ui.js';
import * as LoadoutUI from './ui/loadout-ui.js';

// Public namespace makes the new architecture easy to inspect/debug from DevTools.
window.FrontierAshes = {
  ...(window.FrontierAshes || {}),
  Player,
  Enemies,
  Weapons,
  Combat,
  Inventory,
  Loot,
  Building,
  Save,
  InventoryUI,
  LoadoutUI,
  version: 'vite-modular-foundation'
};
