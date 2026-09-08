/* Frontier Ashes — Phase 1, Commit 4: HUD UI extraction.
   Consumes the Commit 3 HUD state adapter. The legacy HUD implementation remains
   in game-v3.js for rollback safety until this extraction is proven in-game.
*/
(function(){
  const stateAdapter=window.FrontierAshesHudState;
  if(!stateAdapter||typeof stateAdapter.snapshot!=='function')return;

  const INVENTORY_CHANGED='frontierashes:inventoryChanged';
  const legacyUpdateInventory=window.updateInventory;

  function updateHud(){
    const state=stateAdapter.snapshot(player,nearbyCrate);

    document.getElementById('hp-fill').style.width=`${Math.max(0,player.hp/player.maxHp*100)}%`;
    document.getElementById('hp-text').textContent=`${state.hp}/${state.maxHp}`;
    document.getElementById('ammo-text').textContent=`${state.ammo}/${state.reserve}`;

    const dodge=document.getElementById('dodge');
    if(state.dodgeCooldown>0){
      dodge.textContent=Math.ceil(state.dodgeCooldown);
      dodge.classList.add('cooling');
    }else{
      dodge.textContent='↯';
      dodge.classList.remove('cooling');
    }

    document.getElementById('interact').classList.toggle('hidden',!state.nearCrate||lootOpen);
  }

  // Inventory rendering now has its own event path. Existing callers of
  // updateInventory remain valid, but they emit a state-change event instead
  // of making inventory rendering part of every HUD refresh.
  document.addEventListener(INVENTORY_CHANGED,()=>{
    if(typeof legacyUpdateInventory==='function')legacyUpdateInventory();
  });

  window.updateInventory=function(){
    document.dispatchEvent(new Event(INVENTORY_CHANGED));
  };

  window.FrontierAshesHud={updateHud,inventoryChanged(){
    document.dispatchEvent(new Event(INVENTORY_CHANGED));
  }};

  // Replace the Commit 3 HUD entry point. Commit 3's adapter remains loaded
  // and its legacy reference remains available for rollback/debugging.
  window.updateHud=updateHud;
})();
