/* Frontier Ashes — Raid state foundation
   Phase 1 only: persistent stash + temporary raid state.
   Gameplay/UI hooks are intentionally left for the next chunks. */

const STASH_KEY = 'frontierAshesStash';

// Permanent storage: survives raids and browser refreshes.
let stash = {
  weapons: [],
  ammo: {},
  items: {}
};

// Temporary storage: exists only for the current raid.
let raidInventory = {
  weapons: [],
  ammo: {},
  items: {}
};

// One insured weapon + its starting ammunition for the next raid.
let loadout = {
  weapon: null,
  ammoType: null,
  ammo: 0,
  insured: true
};

// Raid lifecycle state.
let raid = {
  active: false,
  status: 'loadout',
  extracted: false,
  extractionProgress: 0,
  extractionPoint: null
};

function emptyStash() {
  return { weapons: [], ammo: {}, items: {} };
}

function emptyRaidInventory() {
  return { weapons: [], ammo: {}, items: {} };
}

function loadStash() {
  try {
    const saved = localStorage.getItem(STASH_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') return;

    stash = {
      weapons: Array.isArray(parsed.weapons) ? parsed.weapons : [],
      ammo: parsed.ammo && typeof parsed.ammo === 'object' ? parsed.ammo : {},
      items: parsed.items && typeof parsed.items === 'object' ? parsed.items : {}
    };
  } catch (error) {
    console.warn('Frontier Ashes: unable to load stash.', error);
    stash = emptyStash();
  }
}

function saveStash() {
  try {
    localStorage.setItem(STASH_KEY, JSON.stringify(stash));
    return true;
  } catch (error) {
    console.warn('Frontier Ashes: unable to save stash.', error);
    return false;
  }
}

// Give a first-time player a basic insured weapon so the upcoming loadout
// screen has something selectable. Existing saved stashes are never changed.
function ensureStarterStash() {
  if (stash.weapons.length > 0) return;

  stash.weapons.push({
    name: 'Rust Pistol',
    rarity: 'Common',
    ammo: '9mm Ammo'
  });

  if (typeof stash.ammo['9mm Ammo'] !== 'number') {
    stash.ammo['9mm Ammo'] = 60;
  }

  saveStash();
}

loadStash();
ensureStarterStash();
