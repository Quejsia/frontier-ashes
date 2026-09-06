// Frontier Ashes — weapon catalog adapter.
export const RARITIES = ['Common', 'Uncommon', 'Epic', 'Legendary', 'Mythic', 'Secret', 'Special'];

export const WEAPON_AMMO = {
  'Rust Pistol': '9mm Ammo',
  'Service Pistol': '9mm Ammo',
  'Combat SMG': '9mm Ammo',
  'Pump Shotgun': '12 Gauge',
  'Assault Rifle': '5.56 Ammo',
  'Marksman Rifle': '7.62 Ammo',
  'Thunderbolt AR': '5.56 Ammo',
  'Wasteland Reaper': '7.62 Ammo',
  'ARGUS Prototype': 'Energy Cell',
  'Ashen Nova': 'Energy Cell'
};

export function getEquippedWeapon() {
  return globalThis.loadout?.weapon ?? null;
}

export function getWeaponStats() {
  return globalThis.FrontierAshesWeaponStats?.stats?.() ?? null;
}
