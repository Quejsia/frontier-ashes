/* Frontier Ashes — Phase 1, Commit 6: loot state bridge.
   Non-destructive bridge exposing legacy lexical state to the new loot/inventory
   modules. Legacy variables and functions remain untouched for rollback safety.
*/
(function(){
  globalThis.FrontierAshesLootState={
    getPlayer:()=>player,
    getCrates:()=>crates,
    getCurrentCrate:()=>currentCrate,
    getInventory:()=>inv,
    getOwnedWeapons:()=>ownedWeapons,
    setCurrentCrate:value=>{currentCrate=value},
    setLootOpen:value=>{lootOpen=!!value},
    isLootOpen:()=>lootOpen,
    markCrateOpened:crate=>{crate.open=true;crate.loot=null},
    clearCurrentCrate:()=>{currentCrate=null}
  };
})();
