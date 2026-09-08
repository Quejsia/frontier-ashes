// Frontier Ashes — inventory state system.
// Commit 6 adds loot-storage operations while preserving existing facades.

export function getInventory(){return globalThis.FrontierAshesLootState?.getInventory?.()??globalThis.inv??null}
export function getRaidInventory(){return globalThis.raidInventory??null}
export function getStash(){return globalThis.stash??null}
export function refreshInventoryUI(){if(typeof globalThis.updateInventory==='function')globalThis.updateInventory()}

function uid(){return `raidgun-${Date.now()}-${Math.random().toString(36).slice(2,9)}`}

export function storeLootItems(items){
  const state=globalThis.FrontierAshesLootState;
  const inv=state?.getInventory?.();
  const ownedWeapons=state?.getOwnedWeapons?.();
  const raid=globalThis.raidInventory;
  if(!inv||!Array.isArray(ownedWeapons)||!Array.isArray(items))return false;

  for(const item of items){
    if(item.type==='weapon'){
      const weapon={name:item.name,rarity:item.rarity?.name||item.rarity||'Common',ammo:item.ammo||'9mm Ammo'};
      ownedWeapons.push(weapon);
      inv.Weapons=(Number(inv.Weapons)||0)+1;
      if(raid&&Array.isArray(raid.weapons))raid.weapons.push({id:uid(),...weapon,magAmmo:0,reserve:0,insured:false});
    }else{
      const qty=Math.max(0,Number(item.qty)||0);
      inv[item.name]=(Number(inv[item.name])||0)+qty;
      if(raid){
        if(!raid.ammo)raid.ammo={};
        if(!raid.items)raid.items={};
        const target=item.type==='ammo'?raid.ammo:raid.items;
        target[item.name]=(Number(target[item.name])||0)+qty;
      }
    }
  }
  refreshInventoryUI();
  return true;
}

export function storeLootItem(item){return storeLootItems(item?[item]:[])}
